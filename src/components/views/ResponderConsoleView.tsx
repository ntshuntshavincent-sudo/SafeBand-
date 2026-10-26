import React, { useState } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Radio, 
  Car, 
  Clock, 
  Battery, 
  AlertOctagon, 
  Lock, 
  LogOut, 
  CheckCircle2, 
  Volume2, 
  Shield, 
  FileCheck,
  Send,
  Navigation
} from 'lucide-react';
import { SOSDistressSignal } from '../../types';
import { useRealtime } from '../../context/RealtimeContext';
import { ConnectionStatusBadge } from '../ConnectionStatusBadge';
import { RealTimeMap, ResponderMarker } from '../RealTimeMap';

interface ResponderConsoleViewProps {
  activeSignal?: SOSDistressSignal | null;
  onDispatchUnit?: (signalId: string, unitName: string) => void;
  onResolveSignal?: (signalId: string) => void;
}

const AVAILABLE_PATROL_UNITS = [
  { name: 'Patrol Unit 04 (Kingsway/Braamfontein Corridor)', defaultEta: 2, offsetLat: 0.0018, offsetLng: 0.0022 },
  { name: 'Patrol Unit 02 (Campus North Gate Mobile)', defaultEta: 4, offsetLat: -0.0025, offsetLng: 0.0015 },
  { name: 'Residence Night Escort Team Beta', defaultEta: 3, offsetLat: 0.0012, offsetLng: -0.0019 },
  { name: 'Brixton SAPS Rapid Support Vehicle', defaultEta: 6, offsetLat: -0.0035, offsetLng: -0.0030 }
];

export const ResponderConsoleView: React.FC<ResponderConsoleViewProps> = () => {
  const { 
    status: connStatus, 
    activeIncidents, 
    isResponderAuth, 
    authenticateResponder, 
    logoutResponder, 
    dispatchUnit, 
    resolveIncident,
    playAlertChime 
  } = useRealtime();

  const [inputCode, setInputCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Dispatch control state per incident
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});
  const [selectedEtas, setSelectedEtas] = useState<Record<string, number>>({});
  const [dispatchNotes, setDispatchNotes] = useState<Record<string, string>>({});
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setIsSubmittingAuth(true);
    setAuthError('');
    const success = await authenticateResponder(inputCode.trim());
    setIsSubmittingAuth(false);
    if (!success) {
      setAuthError('Invalid Access Code. Default: CAMPUS-SEC-2026');
    }
  };

  const handleDispatch = (incidentId: string) => {
    const unitName = selectedUnits[incidentId] || AVAILABLE_PATROL_UNITS[0].name;
    const etaMinutes = selectedEtas[incidentId] || 3;
    const notes = dispatchNotes[incidentId] || '';
    dispatchUnit(incidentId, unitName, etaMinutes, notes);
  };

  const handleResolve = (incidentId: string) => {
    const notes = resolutionNotes[incidentId] || 'Resolved safely on-scene by campus protection patrol.';
    resolveIncident(incidentId, notes);
  };

  // Login view if unauthenticated
  if (!isResponderAuth) {
    return (
      <div className="max-w-md mx-auto py-8 px-4 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 mx-auto flex items-center justify-center">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Campus First Responder Terminal</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Restricted console for university protection officers, Community Policing Forums (CPFs), and GBV emergency response desks.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Responder Access Code / PIN:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Enter Campus PIN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono tracking-wider"
                  autoFocus
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
                Development Default: <span className="text-blue-400 font-semibold cursor-pointer" onClick={() => setInputCode('CAMPUS-SEC-2026')}>CAMPUS-SEC-2026</span>
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-xl text-xs text-rose-300 font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingAuth}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 cursor-pointer disabled:opacity-50"
            >
              <Radio className="w-4 h-4" />
              <span>{isSubmittingAuth ? 'Authenticating...' : 'Authorize Terminal Session'}</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Terminal Protocol: WSS/TLS</span>
            <ConnectionStatusBadge status={connStatus} />
          </div>
        </div>
      </div>
    );
  }

  // Sorted active incidents (critical first, then newest)
  const sortedIncidents = [...activeIncidents].sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (b.severity === 'critical' && a.severity !== 'critical') return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Top Banner Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">
                  Campus Protection & Rapid Response Dispatch Terminal
                </h2>
              </div>
              <p className="text-[11px] text-slate-400">
                Authoritative multi-client feed · Live GPS breadcrumb tracking · Instant unit dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ConnectionStatusBadge status={connStatus} />
            <button
              onClick={playAlertChime}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              title="Test Tactical Alarm Audio"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Chime</span>
            </button>
            <button
              onClick={logoutResponder}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="Logout Responder Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Incidents Queue Header */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-300">
        <div className="flex items-center gap-2 font-bold">
          <AlertOctagon className="w-4 h-4 text-rose-500" />
          <span>Active Geofenced Distress Incidents</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
          sortedIncidents.length > 0
            ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
        }`}>
          {sortedIncidents.length} Active Incident{sortedIncidents.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Empty State when no active incidents */}
      {sortedIncidents.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">All Clear — No Active SOS Alerts</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            The campus safety gateway is actively listening for live distress signals over WebSocket. Trigger an SOS from the Survivor Vault view to observe immediate real-time dispatch.
          </p>
        </div>
      )}

      {/* Active Incidents List */}
      <div className="space-y-4">
        {sortedIncidents.map((signal) => {
          // Prepare responder markers around survivor's current coords
          const responderMarkers: ResponderMarker[] = AVAILABLE_PATROL_UNITS.map((unit, idx) => ({
            id: `unit-${idx}`,
            name: unit.name.split(' (')[0],
            lat: signal.latitude + unit.offsetLat,
            lng: signal.longitude + unit.offsetLng,
            status: signal.assignedResponder?.includes(unit.name.split(' (')[0]) ? 'en_route' : 'patrolling',
            etaMinutes: signal.assignedResponder?.includes(unit.name.split(' (')[0]) ? (signal.responderEtaMinutes || unit.defaultEta) : unit.defaultEta
          }));

          const breadcrumbs = (signal.breadcrumbs || []).map(b => ({ lat: b.lat, lng: b.lng }));

          const currentUnitChoice = selectedUnits[signal.id] || AVAILABLE_PATROL_UNITS[0].name;
          const currentEtaChoice = selectedEtas[signal.id] || AVAILABLE_PATROL_UNITS[0].defaultEta;

          return (
            <div
              key={signal.id}
              className="p-5 bg-slate-900 border-2 border-rose-900/80 rounded-2xl space-y-4 shadow-xl shadow-rose-950/20 animate-in fade-in"
            >
              {/* Incident Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <AlertOctagon className="w-5 h-5 text-rose-500 animate-pulse shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{signal.campusZone}</h4>
                    <div className="text-[11px] text-slate-400 font-mono">
                      ID: {signal.id} · Pseudonym: <strong className="text-slate-200">{signal.survivorPseudonym}</strong> · {new Date(signal.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    signal.status === 'dispatched' 
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                  }`}>
                    {signal.status}
                  </span>
                  <span className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-800 rounded text-[10px] font-bold uppercase">
                    Critical Priority
                  </span>
                </div>
              </div>

              {/* Geolocation & Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">GPS COORDINATES</div>
                  <div className="text-slate-200 font-bold mt-0.5">
                    {signal.latitude.toFixed(4)}, {signal.longitude.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-emerald-400">±{signal.accuracy}m GPS lock</div>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">DEVICE STATUS</div>
                  <div className="text-slate-200 mt-0.5 flex items-center gap-1 font-bold">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{signal.batteryLevel}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {signal.audioRecordingCaptured ? 'Audio Packet Attached' : 'Silent Mode'}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">ASSIGNED UNIT</div>
                  <div className="text-slate-200 font-semibold truncate mt-0.5" title={signal.assignedResponder || 'Pending Dispatch'}>
                    {signal.assignedResponder ? signal.assignedResponder.split(' (')[0] : 'None Assigned'}
                  </div>
                  <div className="text-[10px] text-blue-400">
                    {signal.assignedResponder ? `ETA: ${signal.responderEtaMinutes} min` : 'Action Required'}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">LIFELINES NOTIFIED</div>
                  <div className="text-slate-200 font-bold mt-0.5">
                    {signal.emergencyContactsNotified} Contacts
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate" title={signal.integrityHash}>
                    Hash: {signal.integrityHash.slice(0, 10)}...
                  </div>
                </div>
              </div>

              {/* Live Interactive Leaflet Map for this Incident */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Live Survivor Tracking & Tactical Unit Perimeter
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {breadcrumbs.length} Breadcrumbs Logged
                  </span>
                </div>

                <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                  <RealTimeMap
                    latitude={signal.latitude}
                    longitude={signal.longitude}
                    accuracy={signal.accuracy}
                    breadcrumbs={breadcrumbs}
                    responderUnits={responderMarkers}
                    pinLabel={`Survivor: ${signal.survivorPseudonym}`}
                  />
                </div>
              </div>

              {/* Tactical Unit Dispatch Form */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Car className="w-4 h-4 text-blue-400" />
                  <span>Tactical Patrol Dispatch & Unit Allocation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">
                      Select Response Unit:
                    </label>
                    <select
                      value={currentUnitChoice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedUnits(prev => ({ ...prev, [signal.id]: val }));
                        const unit = AVAILABLE_PATROL_UNITS.find(u => u.name === val);
                        if (unit) {
                          setSelectedEtas(prev => ({ ...prev, [signal.id]: unit.defaultEta }));
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                    >
                      {AVAILABLE_PATROL_UNITS.map((u, i) => (
                        <option key={i} value={u.name}>
                          {u.name} (Avg ETA {u.defaultEta}m)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">
                      Assigned ETA:
                    </label>
                    <select
                      value={currentEtaChoice}
                      onChange={(e) => setSelectedEtas(prev => ({ ...prev, [signal.id]: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    >
                      <option value={1}>1 Minute</option>
                      <option value={2}>2 Minutes</option>
                      <option value={3}>3 Minutes</option>
                      <option value={5}>5 Minutes</option>
                      <option value={8}>8 Minutes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={dispatchNotes[signal.id] || ''}
                    onChange={(e) => setDispatchNotes(prev => ({ ...prev, [signal.id]: e.target.value }))}
                    placeholder="Dispatch note (e.g. 'Approaching via Gate 2 North corridor, silent sirens')"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => handleDispatch(signal.id)}
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-blue-950/50 cursor-pointer"
                  >
                    <Car className="w-4 h-4" />
                    <span>{signal.status === 'dispatched' ? 'Re-Dispatch / Update ETA' : 'Dispatch Unit to Coords'}</span>
                  </button>

                  <button
                    onClick={() => handleResolve(signal.id)}
                    className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Stand Down & File Docket</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
