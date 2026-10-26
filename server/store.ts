import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SOSDistressSignal, BreadcrumbPoint, DispatchEvent } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'safeband-store.json');

export interface SafeBandStoreData {
  incidents: Record<string, SOSDistressSignal>;
  dispatchEvents: DispatchEvent[];
  checkIns: Array<{
    id: string;
    survivorPseudonym: string;
    destination: string;
    etaMinutes: number;
    deadline: string;
    status: 'active' | 'completed' | 'overdue';
    createdAt: string;
  }>;
  evidenceChunks: Array<{
    id: string;
    incidentId?: string;
    chunkIndex: number;
    timestamp: string;
    sizeBytes: number;
    hash: string;
  }>;
}

class StoreManager {
  private data: SafeBandStoreData = {
    incidents: {},
    dispatchEvents: [],
    checkIns: [],
    evidenceChunks: []
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        // Start fresh with clean empty store
        this.data = {
          incidents: {},
          dispatchEvents: [],
          checkIns: [],
          evidenceChunks: []
        };
        this.save();
      }
    } catch (err) {
      console.error('[Store] Failed to load store, initializing fallback in memory', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpPath = `${STORE_FILE}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, STORE_FILE);
    } catch (err) {
      console.error('[Store] Error saving store to file:', err);
    }
  }

  public createIncident(incident: SOSDistressSignal): SOSDistressSignal {
    const fullIncident: SOSDistressSignal = {
      ...incident,
      status: incident.status || 'broadcasting',
      severity: incident.severity || 'critical',
      trackingToken: incident.trackingToken || Math.random().toString(36).substring(2, 10),
      trackingExpiresAt: incident.trackingExpiresAt || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      trackingRevoked: false,
      smsDeliveryStatus: incident.smsDeliveryStatus || [],
      breadcrumbs: incident.breadcrumbs || [
        {
          lat: incident.latitude,
          lng: incident.longitude,
          accuracy: incident.accuracy,
          battery: incident.batteryLevel,
          timestamp: incident.timestamp || new Date().toISOString()
        }
      ],
      dispatchEvents: incident.dispatchEvents || []
    };

    this.data.incidents[incident.id] = fullIncident;
    this.save();
    return fullIncident;
  }

  public updateIncident(id: string, updates: Partial<SOSDistressSignal>): SOSDistressSignal | null {
    const existing = this.data.incidents[id];
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      // If coordinates updated, update top-level lat/lng too
      latitude: updates.latitude ?? existing.latitude,
      longitude: updates.longitude ?? existing.longitude,
      accuracy: updates.accuracy ?? existing.accuracy,
    };

    this.data.incidents[id] = updated;
    this.save();
    return updated;
  }

  public addBreadcrumb(id: string, point: BreadcrumbPoint): SOSDistressSignal | null {
    const existing = this.data.incidents[id];
    if (!existing) return null;

    const breadcrumbs = existing.breadcrumbs || [];
    breadcrumbs.push(point);

    // Keep up to 200 recent breadcrumbs for performance
    if (breadcrumbs.length > 200) {
      breadcrumbs.shift();
    }

    const updated: SOSDistressSignal = {
      ...existing,
      latitude: point.lat,
      longitude: point.lng,
      accuracy: point.accuracy,
      batteryLevel: point.battery ?? existing.batteryLevel,
      breadcrumbs
    };

    this.data.incidents[id] = updated;
    this.save();
    return updated;
  }

  public dispatchUnit(
    incidentId: string, 
    unitName: string, 
    etaMinutes: number, 
    notes?: string
  ): SOSDistressSignal | null {
    const existing = this.data.incidents[incidentId];
    if (!existing) return null;

    const dispatchEvent: DispatchEvent = {
      id: `DISP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      unitName,
      etaMinutes,
      notes,
      status: 'dispatched'
    };

    const dispatchEvents = existing.dispatchEvents || [];
    dispatchEvents.push(dispatchEvent);
    this.data.dispatchEvents.push(dispatchEvent);

    const updated: SOSDistressSignal = {
      ...existing,
      status: 'dispatched',
      assignedResponder: unitName,
      responderEtaMinutes: etaMinutes,
      securityNotes: notes ? `${existing.securityNotes ? existing.securityNotes + ' | ' : ''}${notes}` : existing.securityNotes,
      dispatchEvents
    };

    this.data.incidents[incidentId] = updated;
    this.save();
    return updated;
  }

  public resolveIncident(incidentId: string, resolutionNotes?: string): SOSDistressSignal | null {
    const existing = this.data.incidents[incidentId];
    if (!existing) return null;

    const updated: SOSDistressSignal = {
      ...existing,
      status: 'resolved',
      securityNotes: resolutionNotes 
        ? `${existing.securityNotes ? existing.securityNotes + ' [RESOLVED: ' + resolutionNotes + ']' : '[RESOLVED: ' + resolutionNotes + ']'}` 
        : existing.securityNotes
    };

    this.data.incidents[incidentId] = updated;
    this.save();
    return updated;
  }

  public getIncident(id: string): SOSDistressSignal | undefined {
    return this.data.incidents[id];
  }

  public getIncidentByTrackingToken(token: string): { incident?: SOSDistressSignal; reason?: 'expired' | 'revoked' | 'resolved' | 'not_found' } {
    const incident = Object.values(this.data.incidents).find(inc => inc.trackingToken === token);
    if (!incident) {
      return { reason: 'not_found' };
    }
    if (incident.trackingRevoked) {
      return { reason: 'revoked' };
    }
    if (incident.status === 'resolved') {
      return { reason: 'resolved' };
    }
    if (incident.trackingExpiresAt && new Date(incident.trackingExpiresAt).getTime() < Date.now()) {
      return { reason: 'expired' };
    }
    return { incident };
  }

  public revokeTrackingToken(tokenOrId: string): SOSDistressSignal | null {
    const incident = Object.values(this.data.incidents).find(
      inc => inc.trackingToken === tokenOrId || inc.id === tokenOrId
    );
    if (!incident) return null;

    incident.trackingRevoked = true;
    this.data.incidents[incident.id] = incident;
    this.save();
    return incident;
  }

  public recordSmsDelivery(
    incidentId: string,
    delivery: {
      to: string;
      name?: string;
      status: 'sent' | 'simulated' | 'failed';
      provider: string;
      messageSid?: string;
      error?: string;
      timestamp: string;
    }
  ) {
    const incident = this.data.incidents[incidentId];
    if (incident) {
      incident.smsDeliveryStatus = incident.smsDeliveryStatus || [];
      incident.smsDeliveryStatus.push(delivery);
      this.save();
    }
  }

  public getActiveIncidents(): SOSDistressSignal[] {
    return Object.values(this.data.incidents)
      .filter(i => i.status !== 'resolved')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getAllIncidents(): SOSDistressSignal[] {
    return Object.values(this.data.incidents)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public recordEvidenceChunk(chunk: {
    id: string;
    incidentId?: string;
    chunkIndex: number;
    timestamp: string;
    sizeBytes: number;
    hash: string;
  }) {
    this.data.evidenceChunks.push(chunk);
    this.save();
  }
}

export const store = new StoreManager();
