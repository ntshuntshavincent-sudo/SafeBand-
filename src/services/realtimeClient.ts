import { 
  WSClientMessage, 
  WSServerMessage, 
  ClientRole, 
  ConnectionStatus 
} from '../types';
import { 
  enqueueOfflineMessage, 
  getQueuedOfflineMessages, 
  removeQueuedOfflineMessage 
} from './offlineQueue';

type MessageListener = (msg: WSServerMessage) => void;
type StatusListener = (status: ConnectionStatus) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'offline';
  private role: ClientRole = 'survivor';
  private credentials: { code?: string; pseudonym?: string; token?: string; incidentId?: string } = {};
  
  private messageListeners: Set<MessageListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  
  private reconnectAttempt: number = 0;
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private isExplicitlyClosed: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.status !== 'connected') {
          this.reconnectAttempt = 0;
          this.connect(this.role, this.credentials);
        }
      });
      window.addEventListener('offline', () => {
        this.setStatus('offline');
      });

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_FLUSH_SOS') {
            this.flushOfflineBuffer();
          }
        });
      }
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getRole(): ClientRole {
    return this.role;
  }

  public setRole(
    role: ClientRole, 
    credentials?: { code?: string; pseudonym?: string; token?: string; incidentId?: string }
  ) {
    this.role = role;
    if (credentials) {
      this.credentials = { ...this.credentials, ...credentials };
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendRoleAuth();
    } else if (this.status !== 'connected') {
      this.connect(role, credentials);
    }
  }

  private setStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach(listener => listener(newStatus));
    }
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public connect(
    role: ClientRole = 'survivor', 
    credentials: { code?: string; pseudonym?: string; token?: string; incidentId?: string } = {}
  ) {
    this.role = role;
    this.credentials = { ...this.credentials, ...credentials };
    this.isExplicitlyClosed = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      // Already active or connecting; re-send auth if role changed
      this.sendRoleAuth();
      return;
    }

    if (typeof window === 'undefined') return;

    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'reconnecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.setStatus('connected');
        this.sendRoleAuth();
        this.flushOfflineBuffer();
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WSServerMessage = JSON.parse(event.data);
          this.messageListeners.forEach(fn => fn(data));
        } catch (err) {
          console.error('[WS Client] Parse error:', err);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (!this.isExplicitlyClosed) {
          this.setStatus(navigator.onLine ? 'reconnecting' : 'offline');
          this.scheduleReconnect();
        } else {
          this.setStatus('offline');
        }
      };

      this.ws.onerror = () => {
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch (err) {
      console.warn('[WS Client] Connection init failed:', err);
      this.scheduleReconnect();
    }
  }

  private sendRoleAuth() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (this.role === 'responder') {
      const code = this.credentials.code || localStorage.getItem('safeband_responder_code') || '';
      if (code) {
        this.sendImmediate({
          type: 'auth:responder',
          payload: { code }
        });
      }
    } else if (this.role === 'survivor') {
      this.sendImmediate({
        type: 'auth:survivor',
        payload: {
          pseudonym: this.credentials.pseudonym || 'Survivor-Local',
          incidentId: this.credentials.incidentId
        }
      });
    } else if (this.role === 'tracker') {
      this.sendImmediate({
        type: 'auth:tracker',
        payload: { token: this.credentials.token }
      });
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    // Exponential backoff: 1000, 2000, 4000, max 10000ms with jitter
    const delay = Math.min(1000 * Math.pow(1.8, this.reconnectAttempt), 10000) + Math.random() * 500;
    this.reconnectAttempt++;

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isExplicitlyClosed && navigator.onLine) {
        this.connect(this.role, this.credentials);
      }
    }, delay);
  }

  private sendImmediate(message: WSClientMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  public send(message: WSClientMessage): boolean {
    const success = this.sendImmediate(message);
    if (!success) {
      // Buffer into IndexedDB offline queue if offline or socket disconnected
      enqueueOfflineMessage(message);
    }
    return success;
  }

  public async flushOfflineBuffer() {
    try {
      const queued = await getQueuedOfflineMessages();
      if (!queued.length) return;

      for (const item of queued) {
        const sent = this.sendImmediate(item.message);
        if (sent && item.id !== undefined) {
          await removeQueuedOfflineMessage(item.id);
        }
      }
    } catch (err) {
      console.warn('[WS Client] Flush offline buffer error:', err);
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('offline');
  }
}

export const realtimeClient = new RealtimeClient();
