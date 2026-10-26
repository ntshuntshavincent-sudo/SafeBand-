import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { store } from './server/store.js';
import { 
  WSClientMessage, 
  WSServerMessage, 
  ClientRole, 
  SOSDistressSignal,
  BreadcrumbPoint 
} from './src/types/index.js';
import { sendEmergencySms, isTwilioConfigured } from './server/twilio.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';
const RESPONDER_ACCESS_CODE = process.env.RESPONDER_ACCESS_CODE || 'CAMPUS-SEC-2026';

const app = express();
app.use(express.json({ limit: '10mb' }));

interface ClientSession {
  ws: WebSocket;
  role?: ClientRole;
  isAuthenticated: boolean;
  pseudonym?: string;
  trackingToken?: string;
  incidentId?: string;
  isAlive: boolean;
}

const sessions = new Map<WebSocket, ClientSession>();

// REST APIs
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    platform: 'SafeBand ZA Campus Protection Server',
    activeIncidents: store.getActiveIncidents().length,
    twilioLive: isTwilioConfigured(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/system/config', (req: Request, res: Response) => {
  res.json({
    twilioConfigured: isTwilioConfigured(),
    accessCodeConfigured: !!process.env.RESPONDER_ACCESS_CODE
  });
});

// Responder Incidents API
app.get('/api/incidents', (req: Request, res: Response) => {
  const authHeader = req.headers['x-responder-code'] || req.query.code;
  if (authHeader !== RESPONDER_ACCESS_CODE) {
    return res.status(401).json({ error: 'Unauthorized responder code' });
  }
  return res.json({
    incidents: store.getAllIncidents(),
    activeCount: store.getActiveIncidents().length
  });
});

// Public Tracker API for trusted contacts
app.get('/api/track/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const result = store.getIncidentByTrackingToken(token);
  if (!result.incident) {
    const errorMap: Record<string, string> = {
      expired: 'Tracking link has expired (2-hour emergency safety window passed).',
      revoked: 'Tracking link was revoked by the survivor.',
      resolved: 'Incident has been resolved by campus emergency responders.',
      not_found: 'Invalid or expired tracking token.'
    };
    return res.status(404).json({ 
      error: errorMap[result.reason || 'not_found'] || 'Tracking link not available',
      reason: result.reason 
    });
  }

  const incident = result.incident;
  // Return privacy-scrubbed live telemetry (no personal IDs or long-term history)
  res.json({
    id: incident.id,
    survivorPseudonym: incident.survivorPseudonym,
    status: incident.status,
    latitude: incident.latitude,
    longitude: incident.longitude,
    accuracy: incident.accuracy,
    campusZone: incident.campusZone,
    batteryLevel: incident.batteryLevel,
    timestamp: incident.timestamp,
    assignedResponder: incident.assignedResponder,
    responderEtaMinutes: incident.responderEtaMinutes,
    trackingExpiresAt: incident.trackingExpiresAt,
    breadcrumbs: (incident.breadcrumbs || []).slice(-30) // Only recent 30 points for live trail
  });
});

// Revoke tracking link endpoint
app.post('/api/track/:token/revoke', (req: Request, res: Response) => {
  const { token } = req.params;
  const revoked = store.revokeTrackingToken(token);
  if (!revoked) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  // Notify active tracker sockets
  broadcastToTrackers(token, {
    type: 'incident:update',
    payload: { incident: { id: revoked.id, trackingRevoked: true, status: 'resolved' } }
  });

  res.json({ success: true, message: 'Tracking link revoked immediately' });
});

// Broadcast Emergency SMS via Twilio to configured lifelines
app.post('/api/sms/broadcast-sos', async (req: Request, res: Response) => {
  try {
    const { incidentId, contacts, baseUrl } = req.body;
    if (!incidentId || !contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ error: 'incidentId and contacts array required' });
    }

    const incident = store.getIncident(incidentId);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const hostBase = baseUrl || `${req.protocol}://${req.get('host')}`;
    const trackingUrl = `${hostBase}/#/track/${incident.trackingToken}`;

    const deliveries = [];
    for (const c of contacts) {
      if (c.notifySms && c.phone) {
        const result = await sendEmergencySms({
          to: c.phone,
          name: c.name,
          pseudonym: incident.survivorPseudonym,
          campusZone: incident.campusZone,
          trackingUrl,
          batteryLevel: incident.batteryLevel
        });

        store.recordSmsDelivery(incidentId, result);
        deliveries.push(result);
      }
    }

    res.json({
      success: true,
      incidentId,
      trackingUrl,
      twilioConfigured: isTwilioConfigured(),
      deliveries
    });
  } catch (err: any) {
    console.error('[SMS Broadcast Error]:', err);
    res.status(500).json({ error: err.message || 'SMS broadcast failed' });
  }
});

// Responder Auth verification endpoint
app.post('/api/auth/responder', (req: Request, res: Response) => {
  const { code } = req.body;
  if (code === RESPONDER_ACCESS_CODE) {
    return res.json({ success: true, token: 'AUTH-OK-' + Date.now() });
  }
  return res.status(401).json({ success: false, message: 'Invalid Campus Responder PIN' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function sendJson(ws: WebSocket, message: WSServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(message));
    } catch (err) {
      console.error('[WS] Send error:', err);
    }
  }
}

function broadcastToResponders(message: WSServerMessage) {
  for (const session of sessions.values()) {
    if (session.role === 'responder' && session.isAuthenticated) {
      sendJson(session.ws, message);
    }
  }
}

function broadcastToTrackers(token: string, message: WSServerMessage) {
  for (const session of sessions.values()) {
    if (session.role === 'tracker' && session.trackingToken === token) {
      sendJson(session.ws, message);
    }
  }
}

function notifySurvivor(incidentId: string, pseudonym: string | undefined, message: WSServerMessage) {
  for (const session of sessions.values()) {
    if (session.role === 'survivor') {
      if ((session.incidentId && session.incidentId === incidentId) ||
          (pseudonym && session.pseudonym === pseudonym)) {
        sendJson(session.ws, message);
      }
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  const session: ClientSession = {
    ws,
    isAuthenticated: false,
    isAlive: true
  };
  sessions.set(ws, session);

  ws.on('pong', () => {
    session.isAlive = true;
  });

  ws.on('message', (raw: string) => {
    try {
      const msg: WSClientMessage = JSON.parse(raw.toString());
      handleMessage(session, msg);
    } catch (err) {
      console.error('[WS] Failed to parse client message:', err);
    }
  });

  ws.on('close', () => {
    sessions.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('[WS] Socket error:', err);
    sessions.delete(ws);
  });
});

function handleMessage(session: ClientSession, msg: WSClientMessage) {
  const { ws } = session;

  switch (msg.type) {
    case 'ping':
      sendJson(ws, { type: 'pong' });
      break;

    case 'auth:responder': {
      const code = msg.payload?.code;
      if (code === RESPONDER_ACCESS_CODE) {
        session.role = 'responder';
        session.isAuthenticated = true;
        const activeIncidents = store.getActiveIncidents();
        sendJson(ws, {
          type: 'auth:success',
          payload: {
            role: 'responder',
            activeIncidents,
            timestamp: new Date().toISOString()
          }
        });
        sendJson(ws, {
          type: 'init:state',
          payload: {
            incidents: activeIncidents,
            activeIncidentsCount: activeIncidents.length
          }
        });
      } else {
        sendJson(ws, {
          type: 'auth:error',
          payload: { message: 'Invalid Responder Access Code' }
        });
      }
      break;
    }

    case 'auth:survivor': {
      session.role = 'survivor';
      session.isAuthenticated = true;
      session.pseudonym = msg.payload?.pseudonym || 'Survivor-Anonym';
      if (msg.payload?.incidentId) {
        session.incidentId = msg.payload.incidentId;
      }
      sendJson(ws, {
        type: 'auth:success',
        payload: { role: 'survivor', pseudonym: session.pseudonym }
      });
      break;
    }

    case 'auth:tracker': {
      session.role = 'tracker';
      session.isAuthenticated = true;
      session.trackingToken = msg.payload?.token;
      sendJson(ws, {
        type: 'auth:success',
        payload: { role: 'tracker', trackingToken: session.trackingToken }
      });
      if (session.trackingToken) {
        const check = store.getIncidentByTrackingToken(session.trackingToken);
        if (check.incident) {
          sendJson(ws, {
            type: 'incident:update',
            payload: { incident: check.incident }
          });
        }
      }
      break;
    }

    case 'sos:create': {
      const incidentData: SOSDistressSignal = msg.payload?.incident;
      if (!incidentData || !incidentData.id) return;

      session.role = 'survivor';
      session.incidentId = incidentData.id;
      session.pseudonym = incidentData.survivorPseudonym;

      const created = store.createIncident(incidentData);
      console.log(`[SOS TRIGGERED] New distress incident ${created.id} by ${created.survivorPseudonym}`);

      // Acknowledge to survivor
      sendJson(ws, {
        type: 'incident:update',
        payload: { incident: created }
      });

      // Broadcast immediately to ALL active campus responders
      broadcastToResponders({
        type: 'incident:new',
        payload: { incident: created }
      });
      break;
    }

    case 'sos:location': {
      const { incidentId, latitude, longitude, accuracy, battery, speedKmh, heading, timestamp } = msg.payload || {};
      if (!incidentId || typeof latitude !== 'number' || typeof longitude !== 'number') return;

      const breadcrumb: BreadcrumbPoint = {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy || 5,
        battery,
        speedKmh,
        heading,
        timestamp: timestamp || new Date().toISOString()
      };

      const updated = store.addBreadcrumb(incidentId, breadcrumb);
      if (updated) {
        // Broadcast location update and full incident to responders
        broadcastToResponders({
          type: 'location:update',
          payload: { incidentId, breadcrumb, currentCoordinates: { lat: latitude, lng: longitude } }
        });

        // Broadcast to trusted contact tracker links
        if (updated.trackingToken) {
          broadcastToTrackers(updated.trackingToken, {
            type: 'location:update',
            payload: { incidentId, breadcrumb }
          });
        }
      }
      break;
    }

    case 'sos:status': {
      const { incidentId, status, notes } = msg.payload || {};
      if (!incidentId || !status) return;

      const updated = store.updateIncident(incidentId, { status, securityNotes: notes });
      if (updated) {
        broadcastToResponders({
          type: 'incident:update',
          payload: { incident: updated }
        });
        notifySurvivor(incidentId, updated.survivorPseudonym, {
          type: 'incident:update',
          payload: { incident: updated }
        });
      }
      break;
    }

    case 'responder:dispatch': {
      if (session.role !== 'responder') {
        return sendJson(ws, { type: 'auth:error', payload: { message: 'Only authorized responders can dispatch units' } });
      }

      const { incidentId, unitName, etaMinutes, notes } = msg.payload || {};
      if (!incidentId || !unitName) return;

      const updated = store.dispatchUnit(incidentId, unitName, Number(etaMinutes) || 3, notes);
      if (updated) {
        console.log(`[DISPATCH] Incident ${incidentId} assigned to ${unitName} (ETA: ${etaMinutes}m)`);

        const dispatchMsg: WSServerMessage = {
          type: 'dispatch:assigned',
          payload: {
            incidentId,
            assignedResponder: unitName,
            responderEtaMinutes: etaMinutes || 3,
            notes,
            status: 'dispatched',
            incident: updated
          }
        };

        // Notify all responders
        broadcastToResponders(dispatchMsg);

        // Notify the survivor in real time
        notifySurvivor(incidentId, updated.survivorPseudonym, dispatchMsg);
      }
      break;
    }

    case 'responder:resolve': {
      if (session.role !== 'responder') {
        return sendJson(ws, { type: 'auth:error', payload: { message: 'Only authorized responders can resolve signals' } });
      }

      const { incidentId, resolutionNotes } = msg.payload || {};
      if (!incidentId) return;

      const updated = store.resolveIncident(incidentId, resolutionNotes);
      if (updated) {
        console.log(`[RESOLVED] Incident ${incidentId} marked resolved.`);
        const resolveMsg: WSServerMessage = {
          type: 'incident:resolved',
          payload: { incidentId, resolutionNotes, incident: updated }
        };

        broadcastToResponders(resolveMsg);
        notifySurvivor(incidentId, updated.survivorPseudonym, resolveMsg);
      }
      break;
    }

    case 'evidence:chunk': {
      if (msg.payload) {
        store.recordEvidenceChunk(msg.payload);
        sendJson(ws, {
          type: 'queue:flushed',
          payload: { chunkId: msg.payload.id }
        });
      }
      break;
    }

    default:
      break;
  }
}

// Keep-alive heartbeat interval (30s)
const heartbeatInterval = setInterval(() => {
  for (const [ws, session] of sessions.entries()) {
    if (!session.isAlive) {
      ws.terminate();
      sessions.delete(ws);
      continue;
    }
    session.isAlive = false;
    try {
      ws.ping();
    } catch {
      ws.terminate();
      sessions.delete(ws);
    }
  }
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Vite middleware in dev or static files in production
async function setupViteOrStatic() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }
}

setupViteOrStatic().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  🛡️ SafeBand Real-Time Server running on port ${PORT}`);
    console.log(`  🌐 Web + WebSocket Server: http://0.0.0.0:${PORT}`);
    console.log(`  🔑 Campus Responder Access Code: ${RESPONDER_ACCESS_CODE}`);
    console.log(`======================================================\n`);
  });
});
