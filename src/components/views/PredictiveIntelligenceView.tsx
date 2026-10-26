import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShieldAlert, 
  Activity, 
  MapPin, 
  Zap, 
  Battery, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Radio, 
  LocateFixed, 
  Navigation,
  ShieldCheck,
  Compass,
  ExternalLink
} from 'lucide-react';
import { 
  evaluatePredictiveSafety, 
  PredictiveRiskAssessment, 
  MOCK_LOADSHEDDING 
} from '../../utils/predictiveIntelligence';

interface PredictiveIntelligenceViewProps {
  onTriggerSos?: () => void;
}

export const PredictiveIntelligenceView: React.FC<PredictiveIntelligenceViewProps> = ({
  onTriggerSos
}) => {
  // Real owner live position
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number; accuracy: number }>({
    lat: -26.1834,
    lng: 28.0007,
    accuracy: 4.2
  });
  const [realAddress, setRealAddress] = useState<string>('Acquiring real-time physical location...');
  const [speedKmh, setSpeedKmh] = useState<number>(4.2);
  const [headingDeg, setHeadingDeg] = useState<number>(0);
  const [batteryPercent, setBatteryPercent] = useState<number>(75);
  const [loadsheddingStage, setLoadsheddingStage] = useState<number>(2);
  const [gpsStatus, setGpsStatus] = useState<'acquiring' | 'locked' | 'fallback'>('acquiring');
  const [lastPingTime, setLastPingTime] = useState<string>('');
  const [isSimulatedDivergence, setIsSimulatedDivergence] = useState<boolean>(false);

  // Reverse geocoding helper
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const road = data.address?.road || data.address?.suburb || '';
          const city = data.address?.city || data.address?.town || data.address?.state || '';
          const formatted = road && city ? `${road}, ${city}` : data.display_name.split(',').slice(0, 3).join(',');
          setRealAddress(formatted);
          return formatted;
        }
      }
    } catch {
      // Keep default sector
    }
    setRealAddress(`Sector (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
    return null;
  };

  // Acquire real-time device location on mount and watch continuous updates
  useEffect(() => {
    let watchId: number | null = null;

    if ('geolocation' in navigator) {
      setGpsStatus('acquiring');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy * 10) / 10;
          setLiveCoords({ lat, lng, accuracy });
          setGpsStatus('locked');
          setLastPingTime(new Date().toLocaleTimeString());

          if (pos.coords.speed !== null && pos.coords.speed !== undefined) {
            setSpeedKmh(Math.max(1.2, Math.round(pos.coords.speed * 3.6 * 10) / 10));
          }
          if (pos.coords.heading !== null && pos.coords.heading !== undefined) {
            setHeadingDeg(Math.round(pos.coords.heading));
          }

          reverseGeocode(lat, lng);
        },
        (err) => {
          console.warn('Geolocation fallback:', err.message);
          setGpsStatus('fallback');
          // Fall back to IP location
          fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(data => {
              if (data && data.latitude && data.longitude) {
                setLiveCoords({ lat: data.latitude, lng: data.longitude, accuracy: 250 });
                setRealAddress(`${data.city || 'Johannesburg'}, ${data.region || 'Gauteng'}, South Africa`);
                setGpsStatus('locked');
                setLastPingTime(new Date().toLocaleTimeString());
              }
            })
            .catch(() => {});
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (isSimulatedDivergence) return;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy * 10) / 10;
          setLiveCoords({ lat, lng, accuracy });
          setGpsStatus('locked');
          setLastPingTime(new Date().toLocaleTimeString());

          if (pos.coords.speed !== null && pos.coords.speed !== undefined) {
            setSpeedKmh(Math.max(1.0, Math.round(pos.coords.speed * 3.6 * 10) / 10));
          }
          if (pos.coords.heading !== null && pos.coords.heading !== undefined) {
            setHeadingDeg(Math.round(pos.coords.heading));
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
      );
    }

    // Monitor real battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryPercent(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryPercent(Math.round(battery.level * 100));
        });
      }).catch(() => {});
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isSimulatedDivergence]);

  // Compute live assessment using actual live coordinates and parameters
  const [assessment, setAssessment] = useState<PredictiveRiskAssessment>(() => {
    return evaluatePredictiveSafety({
      lat: liveCoords.lat,
      lng: liveCoords.lng,
      speedKmh,
      batteryLevelPercent: batteryPercent,
      isBatteryCharging: false,
      minutesInTransit: 8,
      loadsheddingStage
    });
  });

  useEffect(() => {
    const evaluated = evaluatePredictiveSafety({
      lat: liveCoords.lat,
      lng: liveCoords.lng,
      speedKmh,
      batteryLevelPercent: batteryPercent,
      isBatteryCharging: false,
      minutesInTransit: isSimulatedDivergence ? 22 : 8,
      loadsheddingStage
    });
    setAssessment(evaluated);
  }, [liveCoords, speedKmh, batteryPercent, loadsheddingStage, isSimulatedDivergence]);

  // Toggle threat simulation without score boards or rubrics
  const toggleSimulation = () => {
    if (!isSimulatedDivergence) {
      setIsSimulatedDivergence(true);
      setSpeedKmh(10.8);
      setBatteryPercent(14);
      setLoadsheddingStage(3);
    } else {
      setIsSimulatedDivergence(false);
      setSpeedKmh(4.2);
      setBatteryPercent(75);
      setLoadsheddingStage(2);
      // Re-trigger real GPS
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setLiveCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy * 10) / 10
          });
        });
      }
    }
  };

  const getThreatBadge = () => {
    if (assessment.threatLevel === 'critical_danger') {
      return {
        label: 'Elevated Threat Detected',
        sub: 'Automated Safeguards Active',
        style: 'bg-rose-950/80 text-rose-300 border-rose-700/80 animate-pulse',
        dot: 'bg-rose-500'
      };
    }
    if (assessment.threatLevel === 'high_risk') {
      return {
        label: 'Caution Advisory',
        sub: 'Night Corridor / Low Battery',
        style: 'bg-orange-950/80 text-orange-300 border-orange-700/80',
        dot: 'bg-orange-500'
      };
    }
    if (assessment.threatLevel === 'elevated') {
      return {
        label: 'Advisory: Unlit Transit Corridor',
        sub: 'Passive Telemetry Monitoring',
        style: 'bg-amber-950/80 text-amber-300 border-amber-700/80',
        dot: 'bg-amber-500'
      };
    }
    return {
      label: 'Safe Routine Commute',
      sub: 'Sensors Within Normal Parameters',
      style: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80',
      dot: 'bg-emerald-400'
    };
  };

  const badge = getThreatBadge();

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Real-Time Live Location Telemetry Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">
                  Autonomous Threat Telemetry & Forecasting
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live GPS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Continuously analyzes your real live GPS coordinates, transit velocity, battery life, and local power grid hazards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleSimulation}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                isSimulatedDivergence 
                  ? 'bg-rose-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Simulates rapid movement and battery loss to test autonomous response"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isSimulatedDivergence ? 'Reset to Real Live GPS' : 'Simulate Hazard'}</span>
            </button>
          </div>
        </div>

        {/* Live Location Physical Readout */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 min-w-0">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Current Real-Time Location
              </div>
              <div className="font-semibold text-white truncate">
                {realAddress}
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {liveCoords.lat.toFixed(5)}, {liveCoords.lng.toFixed(5)} · Accuracy: ±{liveCoords.accuracy}m
                {lastPingTime && ` · Pinged ${lastPingTime}`}
              </div>
            </div>
          </div>

          <a
            href={`https://maps.google.com/?q=${liveCoords.lat},${liveCoords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 shrink-0 transition"
            title="Open your real live GPS position in Google Maps"
          >
            <ExternalLink className="w-3 h-3 text-rose-400" />
            <span>Maps</span>
          </a>
        </div>
      </div>

      {/* Threat Status & Trajectory Forecast Card (Clean status layout, zero score board) */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Active Threat Assessment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-xl border text-xs font-bold flex items-center gap-2 ${badge.style}`}>
                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                <span>{badge.label}</span>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">· {badge.sub}</span>
            </div>
          </div>

          {assessment.threatLevel === 'critical_danger' && onTriggerSos && (
            <button
              onClick={onTriggerSos}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-rose-950/50"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Broadcast Silent SOS Now</span>
            </button>
          )}
        </div>

        {/* Behavioral Trajectory Forecast */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Behavioral Trajectory Forecast</span>
          </div>
          <div className="text-sm font-semibold text-white bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            {assessment.forecastedOutcome}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
            <strong className="text-indigo-400">Proactive Guidance:</strong> {assessment.recommendedAction}
          </p>
        </div>

        {/* Autonomous Safeguards Active */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span>Autonomous Actions Deployed by SafeBand</span>
          </div>
          <div className="space-y-1.5 text-xs">
            {assessment.autonomousActionsTriggered.length > 0 ? (
              assessment.autonomousActionsTriggered.map((action, idx) => (
                <div key={idx} className="flex items-center gap-2 text-rose-300 bg-rose-950/30 px-3 py-2 rounded-xl border border-rose-900/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{action}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-emerald-300 bg-emerald-950/30 px-3 py-2 rounded-xl border border-emerald-900/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Routine monitoring: No intervention required. Normal corridor traversal.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Vector Telemetry Sensors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Vector 1: Spatial Corridor Deviation */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>Route Deviation</span>
            </span>
            <span className={`font-mono font-bold ${assessment.metrics.corridorDeviationRisk > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isSimulatedDivergence ? '340m Diverged' : 'On Customary Path'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: isSimulatedDivergence ? '80%' : '15%' }} 
            />
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Learned path: Campus Library → Student Residence
          </p>
        </div>

        {/* Vector 2: Movement Velocity */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Live Speed</span>
            </span>
            <span className="font-mono font-bold text-white">
              {speedKmh.toFixed(1)} km/h
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-sky-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (speedKmh / 12) * 100)}%` }} 
            />
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {speedKmh > 9 ? 'Sprinting / running signature detected' : 'Standard walking rhythm (3-5 km/h)'}
          </p>
        </div>

        {/* Vector 3: Eskom Loadshedding Outage */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Loadshedding Grid</span>
            </span>
            <span className={`font-mono font-bold ${loadsheddingStage > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              Stage {loadsheddingStage}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, loadsheddingStage * 25)}%` }} 
            />
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {loadsheddingStage > 0 ? 'Darkened unlit corridors in sector' : 'Street lighting fully powered'}
          </p>
        </div>

        {/* Vector 4: Device Battery Survival */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span>Battery Reserve</span>
            </span>
            <span className={`font-mono font-bold ${batteryPercent <= 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {batteryPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${batteryPercent <= 15 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${batteryPercent}%` }} 
            />
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            ~{assessment.metrics.batteryDepletionForecastMinutes}m active tracking lifespan remaining
          </p>
        </div>
      </div>

      {/* Detected Anomalies List */}
      {assessment.detectedAnomalies.length > 0 && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/50 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Identified Environmental & Movement Anomalies</span>
          </div>
          <ul className="space-y-1 text-xs text-slate-300">
            {assessment.detectedAnomalies.map((anomaly, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>{anomaly}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
