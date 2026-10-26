import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Battery, 
  Clock, 
  Radio, 
  PhoneCall, 
  AlertTriangle, 
  Car, 
  CheckCircle2, 
  Shield, 
  RefreshCw,
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react';
import { RealTimeMap, ResponderMarker } from '../RealTimeMap';
import { realtimeClient } from '../../services/realtimeClient';

interface LiveTrackerPublicViewProps {
  token: string;
  onExit?: () => void;
}

interface IncidentTrackingData {
  id: string;
  survivorPseudonym: string;
  status: 'broadcasting' | 'acknowledged' | 'dispatched' | 'on_scene' | 'resolved';
  latitude: number;
  longitude: number;
  accuracy: number;
  campusZone: string;
  batteryLevel: number;
  timestamp: string;
  assignedResponder?: string;
  responderEtaMinutes?: number;
  trackingExpiresAt?: string;
  breadcrumbs: Array<{ lat: number; lng: number; timestamp?: string }>;
}

export const LiveTrackerPublicView: React.FC<LiveTrackerPublicViewProps> = ({ token, onExit }) => {
  const [data, setData] = useState<IncidentTrackingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [lastUpdateAgo, setLastUpdateAgo] = useState<number>(0);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const pollIntervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Fetch initial telemetry from server
  const fetchTelemetry = async () => {
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(token)}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorStatus(json.error || 'Tracking link is inactive or has expired.');
        setLoading(false);
        return false;
      }
      const telemetry: IncidentTrackingData = await res.json();
      setData(prev => {
        // Keep previous breadcrumbs if incoming is smaller
        return {
          ...telemetry,
          breadcrumbs: telemetry.breadcrumbs && telemetry.breadcrumbs.length > 0 
            ? telemetry.breadcrumbs 
            : (prev?.breadcrumbs || [{ lat: telemetry.latitude, lng: telemetry.longitude }])
        };
      });
      setErrorStatus(null);
      setLoading(false);
      return true;
    } catch {
      if (!data) {
        setErrorStatus('Unable to reach SafeBand emergency server. Retrying...');
      }
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    fetchTelemetry();

    // Setup periodic polling every 7 seconds
    pollIntervalRef.current = setInterval(fetchTelemetry, 7000);

    // Setup WebSocket connection as tracker role
    realtimeClient.setRole('tracker', { token });
    
    // Connect socket
    const unsubscribeConn = realtimeClient.onStatusChange((status) => {
      setWsConnected(status === 'connected');
      if (status === 'connected') {
        // Authenticate tracker with token
        realtimeClient.send({
          type: 'auth:tracker',
          payload: { token }
        });
      }
    });

    const unsubscribeMsg = realtimeClient.onMessage((msg) => {
      if (msg.type === 'incident:update' && msg.payload?.incident) {
        const inc = msg.payload.incident;
        if (inc.trackingRevoked) {
          setErrorStatus('This tracking link was revoked by the survivor.');
          return;
        }
        setData(prev => {
          if (!prev) return inc;
          return {
            ...prev,
            status: inc.status || prev.status,
            latitude: inc.latitude ?? prev.latitude,
            longitude: inc.longitude ?? prev.longitude,
            accuracy: inc.accuracy ?? prev.accuracy,
            batteryLevel: inc.batteryLevel ?? prev.batteryLevel,
            assignedResponder: inc.assignedResponder ?? prev.assignedResponder,
            responderEtaMinutes: inc.responderEtaMinutes ?? prev.responderEtaMinutes,
          };
        });
        setLastUpdateAgo(0);
      } else if (msg.type === 'location:update' && msg.payload?.breadcrumb) {
        const pt = msg.payload.breadcrumb;
        setData(prev => {
          if (!prev) return null;
          const crumbs = [...prev.breadcrumbs, { lat: pt.lat, lng: pt.lng, timestamp: pt.timestamp }];
          return {
            ...prev,
            latitude: pt.lat,
            longitude: pt.lng,
            accuracy: pt.accuracy ?? prev.accuracy,
            batteryLevel: pt.battery ?? prev.batteryLevel,
            breadcrumbs: crumbs.slice(-50)
          };
        });
        setLastUpdateAgo(0);
      } else if (msg.type === 'dispatch:assigned' && msg.payload) {
        setData(prev => prev ? ({
          ...prev,
          status: 'dispatched',
          assignedResponder: msg.payload.assignedResponder,
          responderEtaMinutes: msg.payload.responderEtaMinutes
        }) : null);
      }
    });

    return () => {
      clearInterval(pollIntervalRef.current);
      unsubscribeConn();
      unsubscribeMsg();
    };
  }, [token]);

  // Update "time ago" counter and expiration countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setLastUpdateAgo(prev => prev + 1);

      if (data?.trackingExpiresAt) {
        const diff = new Date(data.trackingExpiresAt).getTime() - Date.now();
        if (diff <= 0) {
          setTimeRemaining('Expired');
        } else {
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${mins}m ${secs}s`);
        }
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [data]);

  // Responder markers on map
  const responderUnits: ResponderMarker[] = data?.assignedResponder ? [
    {
      id: 'active-unit',
      name: data.assignedResponder,
      lat: (data.latitude || -26.1834) + 0.002,
      lng: (data.longitude || 28.0007) - 0.002,
      status: 'en_route',
      etaMinutes: data.responderEtaMinutes || 3
    }
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
        <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-100">Connecting to Emergency Lifeline...</h2>
        <p className="text-xs text-slate-400 mt-1">Verifying encrypted tracker token and establishing live telemetry link.</p>
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Emergency Tracking Ended</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {errorStatus}
            </p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-left space-y-1.5">
            <div className="font-semibold text-slate-300">Privacy & Safety Notice:</div>
            <p>
              SafeBand tracking tokens automatically expire after 2 hours or immediately upon incident resolution. To safeguard survivor privacy, no continuous location tracking is stored.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href="tel:0800428428"
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call National GBV Command Centre (0800 428 428)</span>
            </a>
            {onExit && (
              <button
                onClick={onExit}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition"
              >
                Return to SafeBand Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
          <div>
            <div className="text-xs font-black tracking-wide uppercase text-rose-400 flex items-center gap-1.5">
              <span>SafeBand ZA Live Emergency Tracker</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Pseudonym: <strong className="text-slate-200">{data.survivorPseudonym}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-full text-[10px] font-mono flex items-center gap-1 border ${
            wsConnected 
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
              : 'bg-amber-950/80 text-amber-300 border-amber-800'
          }`}>
            {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{wsConnected ? 'LIVE WSS' : 'POLLING'}</span>
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700"
            >
              Exit
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4">
        {/* Status Alert Bar */}
        <div className="bg-rose-950/40 border border-rose-900/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                Emergency Lifeline Distress Active
              </span>
            </div>
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{data.campusZone}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              GPS: {data.latitude.toFixed(4)}, {data.longitude.toFixed(4)} (±{data.accuracy}m lock)
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Battery</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                <Battery className="w-3.5 h-3.5" />
                <span>{data.batteryLevel}%</span>
              </div>
            </div>

            <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Updated</div>
              <div className="text-xs font-bold text-slate-200">
                {lastUpdateAgo < 5 ? 'Just now' : `${lastUpdateAgo}s ago`}
              </div>
            </div>

            {timeRemaining && (
              <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Expires</div>
                <div className="text-xs font-bold text-amber-400">
                  {timeRemaining}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dispatch Banner if Responder Dispatched */}
        {data.assignedResponder && (
          <div className="p-4 bg-blue-950/90 border-2 border-blue-500 rounded-2xl shadow-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-extrabold uppercase tracking-wider">
                <Car className="w-4 h-4 text-blue-400 animate-bounce" />
                <span>Campus Responder Dispatched</span>
              </div>
              <span className="text-[10px] text-blue-300 font-mono">
                ETA: ~{data.responderEtaMinutes || 3} mins
              </span>
            </div>
            <div className="text-sm font-bold text-white">
              {data.assignedResponder}
            </div>
            <p className="text-xs text-blue-200">
              Campus security unit has acknowledged this distress call and is actively navigating to the survivor coordinates.
            </p>
          </div>
        )}

        {/* Live Radar Map */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">Live Breadcrumb & Position Stream</span>
            </div>
            <a
              href={`https://maps.google.com/?q=${data.latitude},${data.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="h-80 md:h-96 w-full relative">
            <RealTimeMap
              latitude={data.latitude}
              longitude={data.longitude}
              accuracy={data.accuracy}
              breadcrumbs={data.breadcrumbs || []}
              responderUnits={responderUnits}
              pinLabel={`Distress: ${data.survivorPseudonym}`}
            />
          </div>
        </div>

        {/* Emergency Quick Dial Hotlines for South Africa */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              <span>South African Emergency Lifelines</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Toll-free 24/7</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <a
              href="tel:0800428428"
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-rose-700/60 rounded-xl transition flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-slate-100">GBV Command Centre</div>
                <div className="text-[11px] text-rose-400 font-mono mt-0.5">0800 428 428</div>
              </div>
              <div className="text-[10px] text-slate-500 mt-2">Free call or dial *120*7867#</div>
            </a>

            <a
              href="tel:10111"
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-700/60 rounded-xl transition flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-slate-100">SAPS Flying Squad</div>
                <div className="text-[11px] text-blue-400 font-mono mt-0.5">10111</div>
              </div>
              <div className="text-[10px] text-slate-500 mt-2">National Police Dispatch</div>
            </a>

            <a
              href="tel:0861322322"
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-700/60 rounded-xl transition flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-slate-100">LifeLine South Africa</div>
                <div className="text-[11px] text-emerald-400 font-mono mt-0.5">0861 322 322</div>
              </div>
              <div className="text-[10px] text-slate-500 mt-2">Crisis & Trauma Support</div>
            </a>
          </div>
        </div>

        {/* Privacy & Anti-Surveillance Safeguards */}
        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-300">Privacy Architecture:</strong> This link transmits encrypted telemetry directly to you as a designated emergency contact. No biometric data, real legal identity, or permanent tracking logs are stored on public servers.
          </p>
        </div>
      </main>
    </div>
  );
};
