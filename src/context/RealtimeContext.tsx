import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  ConnectionStatus, 
  ClientRole, 
  SOSDistressSignal, 
  WSServerMessage,
  DispatchEvent 
} from '../types';
import { realtimeClient } from '../services/realtimeClient';

interface RealtimeContextValue {
  status: ConnectionStatus;
  role: ClientRole;
  setRole: (role: ClientRole) => void;
  isResponderAuth: boolean;
  responderCode: string;
  activeIncidents: SOSDistressSignal[];
  currentSurvivorSignal: SOSDistressSignal | null;
  lastDispatchNotice: { unitName: string; etaMinutes: number; notes?: string } | null;
  authenticateResponder: (code: string) => Promise<boolean>;
  logoutResponder: () => void;
  triggerSos: (signal: SOSDistressSignal) => void;
  streamLocationUpdate: (coords: { 
    latitude: number; 
    longitude: number; 
    accuracy: number; 
    battery?: number; 
    speedKmh?: number; 
    heading?: number 
  }) => void;
  dispatchUnit: (incidentId: string, unitName: string, etaMinutes: number, notes?: string) => void;
  resolveIncident: (incidentId: string, resolutionNotes?: string) => void;
  cancelActiveSos: () => void;
  playAlertChime: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionStatus>(realtimeClient.getStatus());
  const [role, setRoleState] = useState<ClientRole>('survivor');
  const [responderCode, setResponderCode] = useState<string>(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('safeband_responder_code') : '') || '';
  });
  const [isResponderAuth, setIsResponderAuth] = useState<boolean>(false);
  const [activeIncidents, setActiveIncidents] = useState<SOSDistressSignal[]>([]);
  const [currentSurvivorSignal, setCurrentSurvivorSignal] = useState<SOSDistressSignal | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('safeband_active_sos');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return null;
  });
  const [lastDispatchNotice, setLastDispatchNotice] = useState<{ unitName: string; etaMinutes: number; notes?: string } | null>(null);

  // Audio synthesis for incoming alarms (Web Audio API)
  const playAlertChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15); // E6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(587.33, now); // D5
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch {
      // Audio autoplay policy handled silently
    }
  }, []);

  // Sync client role with realtimeClient
  const setRole = useCallback((newRole: ClientRole) => {
    setRoleState(newRole);
    if (newRole === 'responder') {
      const code = responderCode || localStorage.getItem('safeband_responder_code') || '';
      realtimeClient.connect('responder', { code });
    } else {
      realtimeClient.connect('survivor', { 
        pseudonym: currentSurvivorSignal?.survivorPseudonym || 'Student-Alpha-78',
        incidentId: currentSurvivorSignal?.id 
      });
    }
  }, [responderCode, currentSurvivorSignal]);

  // Connect on mount
  useEffect(() => {
    const unsubStatus = realtimeClient.onStatusChange(setStatus);
    
    // Connect initially
    const code = localStorage.getItem('safeband_responder_code');
    if (code) {
      setResponderCode(code);
    }
    realtimeClient.connect(role, { 
      code: code || '',
      pseudonym: currentSurvivorSignal?.survivorPseudonym || 'Student-Alpha-78',
      incidentId: currentSurvivorSignal?.id 
    });

    // Handle incoming messages
    const unsubMessage = realtimeClient.onMessage((msg: WSServerMessage) => {
      switch (msg.type) {
        case 'auth:success':
          if (msg.payload?.role === 'responder') {
            setIsResponderAuth(true);
            if (msg.payload.activeIncidents) {
              setActiveIncidents(msg.payload.activeIncidents);
            }
          }
          break;

        case 'auth:error':
          if (role === 'responder') {
            setIsResponderAuth(false);
          }
          break;

        case 'init:state':
          if (msg.payload?.incidents) {
            setActiveIncidents(msg.payload.incidents);
          }
          break;

        case 'incident:new':
          if (msg.payload?.incident) {
            const inc: SOSDistressSignal = msg.payload.incident;
            setActiveIncidents(prev => {
              const filtered = prev.filter(i => i.id !== inc.id);
              return [inc, ...filtered];
            });
            playAlertChime();
          }
          break;

        case 'incident:update':
          if (msg.payload?.incident) {
            const inc: SOSDistressSignal = msg.payload.incident;
            setActiveIncidents(prev => prev.map(i => i.id === inc.id ? inc : i));
            
            // Check if this affects current survivor
            setCurrentSurvivorSignal(prev => {
              if (prev && prev.id === inc.id) {
                localStorage.setItem('safeband_active_sos', JSON.stringify(inc));
                return inc;
              }
              return prev;
            });
          }
          break;

        case 'dispatch:assigned':
          if (msg.payload) {
            const { incidentId, assignedResponder, responderEtaMinutes, notes, incident } = msg.payload;
            if (incident) {
              setActiveIncidents(prev => prev.map(i => i.id === incidentId ? incident : i));
            }
            // If survivor is this incident's creator, update survivor screen
            if (currentSurvivorSignal && currentSurvivorSignal.id === incidentId) {
              const updatedSignal: SOSDistressSignal = {
                ...currentSurvivorSignal,
                status: 'dispatched',
                assignedResponder,
                responderEtaMinutes,
                securityNotes: notes
              };
              setCurrentSurvivorSignal(updatedSignal);
              localStorage.setItem('safeband_active_sos', JSON.stringify(updatedSignal));
              setLastDispatchNotice({ unitName: assignedResponder, etaMinutes: responderEtaMinutes, notes });
              playAlertChime();
            }
          }
          break;

        case 'location:update':
          if (msg.payload?.incidentId && msg.payload?.breadcrumb) {
            const { incidentId, breadcrumb } = msg.payload;
            setActiveIncidents(prev => prev.map(inc => {
              if (inc.id === incidentId) {
                const crumbs = inc.breadcrumbs || [];
                return {
                  ...inc,
                  latitude: breadcrumb.lat,
                  longitude: breadcrumb.lng,
                  accuracy: breadcrumb.accuracy,
                  breadcrumbs: [...crumbs, breadcrumb]
                };
              }
              return inc;
            }));
          }
          break;

        case 'incident:resolved':
          if (msg.payload?.incidentId) {
            const { incidentId, incident } = msg.payload;
            setActiveIncidents(prev => prev.filter(i => i.id !== incidentId));
            if (currentSurvivorSignal && currentSurvivorSignal.id === incidentId) {
              if (incident) {
                setCurrentSurvivorSignal(incident);
              }
            }
          }
          break;

        default:
          break;
      }
    });

    return () => {
      unsubStatus();
      unsubMessage();
    };
  }, [playAlertChime, role, currentSurvivorSignal]);

  const authenticateResponder = useCallback(async (code: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('safeband_responder_code', code);
        setResponderCode(code);
        setIsResponderAuth(true);
        realtimeClient.connect('responder', { code });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logoutResponder = useCallback(() => {
    localStorage.removeItem('safeband_responder_code');
    setResponderCode('');
    setIsResponderAuth(false);
  }, []);

  const triggerSos = useCallback((signal: SOSDistressSignal) => {
    setCurrentSurvivorSignal(signal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('safeband_active_sos', JSON.stringify(signal));
    }
    // Transmit over real WebSocket (or queue in IndexedDB if offline)
    realtimeClient.send({
      type: 'sos:create',
      payload: { incident: signal }
    });
  }, []);

  const streamLocationUpdate = useCallback((coords: { 
    latitude: number; 
    longitude: number; 
    accuracy: number; 
    battery?: number; 
    speedKmh?: number; 
    heading?: number 
  }) => {
    if (!currentSurvivorSignal) return;

    realtimeClient.send({
      type: 'sos:location',
      payload: {
        incidentId: currentSurvivorSignal.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        battery: coords.battery,
        speedKmh: coords.speedKmh,
        heading: coords.heading,
        timestamp: new Date().toISOString()
      }
    });
  }, [currentSurvivorSignal]);

  const dispatchUnit = useCallback((
    incidentId: string, 
    unitName: string, 
    etaMinutes: number, 
    notes?: string
  ) => {
    realtimeClient.send({
      type: 'responder:dispatch',
      payload: { incidentId, unitName, etaMinutes, notes }
    });
  }, []);

  const resolveIncident = useCallback((incidentId: string, resolutionNotes?: string) => {
    realtimeClient.send({
      type: 'responder:resolve',
      payload: { incidentId, resolutionNotes }
    });
  }, []);

  const cancelActiveSos = useCallback(() => {
    if (currentSurvivorSignal) {
      realtimeClient.send({
        type: 'sos:status',
        payload: {
          incidentId: currentSurvivorSignal.id,
          status: 'resolved',
          notes: 'Cancelled safely by survivor'
        }
      });
      setCurrentSurvivorSignal(null);
      localStorage.removeItem('safeband_active_sos');
      setLastDispatchNotice(null);
    }
  }, [currentSurvivorSignal]);

  return (
    <RealtimeContext.Provider
      value={{
        status,
        role,
        setRole,
        isResponderAuth,
        responderCode,
        activeIncidents,
        currentSurvivorSignal,
        lastDispatchNotice,
        authenticateResponder,
        logoutResponder,
        triggerSos,
        streamLocationUpdate,
        dispatchUnit,
        resolveIncident,
        cancelActiveSos,
        playAlertChime
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
