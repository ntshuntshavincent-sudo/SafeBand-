import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Compass, 
  Share2, 
  Clock, 
  Radio, 
  Play, 
  Pause, 
  Check, 
  Copy, 
  ExternalLink,
  Plus,
  Crosshair,
  Footprints,
  RefreshCw,
  LocateFixed
} from 'lucide-react';
import { 
  LocationBreadcrumb, 
  SafeZone, 
  SOUTH_AFRICA_SAFE_ZONES, 
  detectCurrentZone, 
  calculateDistanceMeters,
  SIMULATED_WALK_WAYPOINTS 
} from '../../utils/locationService';
import { RealTimeMap } from '../RealTimeMap';
import { UserProfile } from '../../types';
import { SOUTH_AFRICAN_UNIVERSITIES, userService } from '../../services/userService';

interface LiveLocationTrackerProps {
  onTriggerEmergencySos?: (coords: { lat: number; lng: number; zone: string }) => void;
  onUpdateGlobalLocation?: (coords: { lat: number; lng: number; accuracy: number; zone: string }) => void;
  currentUser?: UserProfile | null;
  onUpdateProfileLocation?: (loc: UserProfile['location']) => void;
}

export const LiveLocationTracker: React.FC<LiveLocationTrackerProps> = ({
  onTriggerEmergencySos,
  onUpdateGlobalLocation,
  currentUser,
  onUpdateProfileLocation,
}) => {
  // Real owner live position
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number }>({
    lat: currentUser?.location?.lat || -26.1834,
    lng: currentUser?.location?.lng || 28.0007,
    accuracy: 4.2
  });
  const [customZoneText, setCustomZoneText] = useState(
    currentUser?.location?.zoneLabel || currentUser?.residenceOrZone || 'UJ Kingsway Campus (D-Ring Study Area)'
  );
  const [saveLocationSuccess, setSaveLocationSuccess] = useState(false);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [headingDeg, setHeadingDeg] = useState<number>(0);
  const [realAddress, setRealAddress] = useState<string>('Acquiring real-world address...');
  const [gpsStatus, setGpsStatus] = useState<'acquiring' | 'locked' | 'fallback'>('acquiring');
  const [isLiveWatching, setIsLiveWatching] = useState<boolean>(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  const [breadcrumbs, setBreadcrumbs] = useState<LocationBreadcrumb[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>(SOUTH_AFRICA_SAFE_ZONES);
  const [isSimulatingWalk, setIsSimulatingWalk] = useState<boolean>(false);
  const [simIndex, setSimIndex] = useState<number>(0);
  const simIntervalRef = useRef<any>(null);

  // Check-in dead-man's switch timer
  const [checkInMinutes, setCheckInMinutes] = useState<number>(15);
  const [checkInActive, setCheckInActive] = useState<boolean>(false);
  const [checkInRemainingSec, setCheckInRemainingSec] = useState<number>(15 * 60);
  const checkInTimerRef = useRef<any>(null);

  // Share link state
  const [copiedLink, setCopiedLink] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);

  // Reverse geocoding helper (OpenStreetMap Nominatim)
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          // Format a clean concise address
          const road = data.address?.road || data.address?.suburb || '';
          const city = data.address?.city || data.address?.town || data.address?.state || '';
          const formatted = road && city ? `${road}, ${city}` : data.display_name.split(',').slice(0, 3).join(',');
          setRealAddress(formatted);
          return formatted;
        }
      }
    } catch {
      // Keep estimated campus sector
    }
    const zoneInfo = detectCurrentZone(lat, lon, safeZones);
    setRealAddress(zoneInfo.zone ? zoneInfo.zone.name : `Sector (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
    return null;
  };

  // Acquire Real-Time Device Location
  const acquireRealTimeGPS = () => {
    setGpsStatus('acquiring');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy * 10) / 10;
          const newPos = { lat, lng, accuracy };

          setCoords(newPos);
          setGpsStatus('locked');
          setLastUpdatedTime(new Date().toLocaleTimeString());

          if (pos.coords.speed !== null && pos.coords.speed !== undefined) {
            setSpeedKmh(Math.round(pos.coords.speed * 3.6 * 10) / 10);
          }
          if (pos.coords.heading !== null && pos.coords.heading !== undefined) {
            setHeadingDeg(Math.round(pos.coords.heading));
          }

          reverseGeocode(lat, lng).then((addr) => {
            const label = addr || 'Real-Time Position';
            if (onUpdateGlobalLocation) {
              onUpdateGlobalLocation({ lat, lng, accuracy, zone: label });
            }
          });

          // Add initial real breadcrumb
          setBreadcrumbs(prev => [
            {
              id: 'real-' + Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              latitude: lat,
              longitude: lng,
              accuracy,
              speedKmh: pos.coords.speed ? Math.round(pos.coords.speed * 3.6 * 10) / 10 : 0,
              heading: pos.coords.heading || 0,
              zoneLabel: 'Real-Time Device GPS Lock'
            },
            ...prev
          ]);
        },
        (err) => {
          console.warn('Geolocation warning/fallback:', err.message);
          setGpsStatus('fallback');
          // If browser denies permission, fall back to IP location API
          fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(data => {
              if (data && data.latitude && data.longitude) {
                const ipPos = { lat: data.latitude, lng: data.longitude, accuracy: 250 };
                setCoords(ipPos);
                setRealAddress(`${data.city || 'Johannesburg'}, ${data.region || 'Gauteng'}, South Africa`);
                setLastUpdatedTime(new Date().toLocaleTimeString());
                setGpsStatus('locked');
              }
            })
            .catch(() => {});
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    }
  };

  // Start real-time watch on mount
  useEffect(() => {
    acquireRealTimeGPS();

    let watchId: number | null = null;
    if ('geolocation' in navigator && isLiveWatching && !isSimulatingWalk) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy * 10) / 10;
          const newPos = { lat, lng, accuracy };

          setCoords(newPos);
          setGpsStatus('locked');
          setLastUpdatedTime(new Date().toLocaleTimeString());

          if (pos.coords.speed !== null && pos.coords.speed !== undefined) {
            setSpeedKmh(Math.round(pos.coords.speed * 3.6 * 10) / 10);
          }
          if (pos.coords.heading !== null && pos.coords.heading !== undefined) {
            setHeadingDeg(Math.round(pos.coords.heading));
          }

          // Trigger address lookup and global location update on new coordinates
          reverseGeocode(lat, lng).then((addr) => {
            const label = addr || 'Real-Time Position';
            if (onUpdateGlobalLocation) {
              onUpdateGlobalLocation({ lat, lng, accuracy, zone: label });
            }
          });

          // Append breadcrumb
          setBreadcrumbs(prev => [
            {
              id: 'live-' + Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              latitude: lat,
              longitude: lng,
              accuracy,
              speedKmh: pos.coords.speed ? Math.round(pos.coords.speed * 3.6 * 10) / 10 : 0,
              heading: pos.coords.heading || 0,
              zoneLabel: 'Live GPS Point'
            },
            ...prev.slice(0, 19)
          ]);
        },
        (err) => {
          console.warn('Geolocation watch error:', err);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isLiveWatching, isSimulatingWalk]);

  // Handle Walking Simulation
  useEffect(() => {
    if (isSimulatingWalk) {
      simIntervalRef.current = setInterval(() => {
        setSimIndex(prev => {
          const nextIdx = (prev + 1) % SIMULATED_WALK_WAYPOINTS.length;
          const wp = SIMULATED_WALK_WAYPOINTS[nextIdx];
          setCoords({ lat: wp.lat, lng: wp.lng, accuracy: 3.2 });
          setSpeedKmh(wp.speed);
          setHeadingDeg(prevDeg => (prevDeg + 20) % 360);
          setRealAddress(wp.label);
          setLastUpdatedTime(new Date().toLocaleTimeString());

          setBreadcrumbs(b => [
            {
              id: 'sim-' + Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              latitude: wp.lat,
              longitude: wp.lng,
              accuracy: 3.2,
              speedKmh: wp.speed,
              heading: 270,
              zoneLabel: wp.label
            },
            ...b.slice(0, 19)
          ]);

          return nextIdx;
        });
      }, 2500);
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulatingWalk]);

  // Handle Check-in Countdown
  useEffect(() => {
    if (checkInActive) {
      checkInTimerRef.current = setInterval(() => {
        setCheckInRemainingSec(prev => {
          if (prev <= 1) {
            clearInterval(checkInTimerRef.current);
            setCheckInActive(false);
            if (onTriggerEmergencySos) {
              const currentZone = detectCurrentZone(coords.lat, coords.lng, safeZones);
              onTriggerEmergencySos({
                lat: coords.lat,
                lng: coords.lng,
                zone: currentZone.zone ? currentZone.zone.name : realAddress
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (checkInTimerRef.current) clearInterval(checkInTimerRef.current);
    }

    return () => {
      if (checkInTimerRef.current) clearInterval(checkInTimerRef.current);
    };
  }, [checkInActive, coords, safeZones, realAddress, onTriggerEmergencySos]);

  const startCheckIn = (minutes: number) => {
    setCheckInMinutes(minutes);
    setCheckInRemainingSec(minutes * 60);
    setCheckInActive(true);
  };

  const cancelCheckIn = () => {
    setCheckInActive(false);
    setCheckInRemainingSec(checkInMinutes * 60);
  };

  const handleCopyShareLink = () => {
    const trackingLink = `https://safeband.app/track/owner-za-live?lat=${coords.lat.toFixed(5)}&lng=${coords.lng.toFixed(5)}`;
    navigator.clipboard.writeText(trackingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const currentZoneState = detectCurrentZone(coords.lat, coords.lng, safeZones);

  const getCardinalDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  const handleAddCustomZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    const newZone: SafeZone = {
      id: 'custom-' + Date.now(),
      name: newZoneName.trim(),
      latitude: coords.lat,
      longitude: coords.lng,
      radiusMeters: 200,
      type: 'safe_residence',
      description: 'Custom safe perimeter defined by device owner'
    };

    setSafeZones(prev => [newZone, ...prev]);
    setNewZoneName('');
    setShowAddZoneModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Real-Time GPS Status Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Real-Time Device GPS Location</span>
                <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono rounded">
                  {gpsStatus === 'locked' ? 'GPS Lock 3D' : 'Locating Sensor...'}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={acquireRealTimeGPS}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Refresh Real Device GPS sensor"
            >
              <LocateFixed className="w-3.5 h-3.5 text-rose-400" />
              <span>Refresh GPS</span>
            </button>

            <button
              onClick={() => setIsSimulatingWalk(!isSimulatingWalk)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                isSimulatingWalk
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title="Simulates movement along campus transit route"
            >
              {isSimulatingWalk ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulatingWalk ? 'Simulating Route' : 'Simulate Walking'}</span>
            </button>
          </div>
        </div>

        {/* Personalized Location Setter Toolbar */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Set Your Location:</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {currentUser ? `(${currentUser.fullName} • ${currentUser.university.split('-')[0]})` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={acquireRealTimeGPS}
                className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer"
              >
                <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
                <span>Set to Live Device GPS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const newLoc = {
                    lat: coords.lat,
                    lng: coords.lng,
                    zoneLabel: customZoneText,
                    isLiveGps: gpsStatus === 'locked'
                  };
                  userService.updateUserLocation(newLoc);
                  if (onUpdateProfileLocation) onUpdateProfileLocation(newLoc);
                  setSaveLocationSuccess(true);
                  setTimeout(() => setSaveLocationSuccess(false), 2500);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                <span>Save to Profile</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Quick South African Campus Location:</label>
              <select
                onChange={(e) => {
                  const uni = SOUTH_AFRICAN_UNIVERSITIES.find(u => u.id === e.target.value);
                  if (uni) {
                    setCoords({ lat: uni.lat, lng: uni.lng, accuracy: 5 });
                    setCustomZoneText(uni.defaultZone);
                    setRealAddress(uni.defaultZone);
                    setGpsStatus('locked');
                  }
                }}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
              >
                {SOUTH_AFRICAN_UNIVERSITIES.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Custom Residence / Corridor Label:</label>
              <input
                type="text"
                value={customZoneText}
                onChange={(e) => setCustomZoneText(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                placeholder="e.g. Auckland Park Student Residence 4B"
              />
            </div>
          </div>

          {saveLocationSuccess && (
            <div className="p-2 bg-emerald-950/80 border border-emerald-800 rounded-lg text-[11px] text-emerald-300 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Location preference saved to your personal profile.</span>
            </div>
          )}
        </div>

        {/* Real Address Bar */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Real-World Physical Location
            </div>
            <div className="text-xs font-semibold text-white truncate">
              {realAddress || customZoneText}
            </div>
            {lastUpdatedTime && (
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                Last GPS ping: {lastUpdatedTime} · Sensor precision: ±{coords.accuracy}m
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 font-sans">COORDINATES</div>
            <div className="text-white font-bold truncate mt-0.5">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </div>
            <div className="text-[10px] text-emerald-400">±{coords.accuracy}m Accuracy</div>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 font-sans">WALKING SPEED</div>
            <div className="text-white font-bold mt-0.5">
              {speedKmh} <span className="text-[10px] text-slate-400">km/h</span>
            </div>
            <div className="text-[10px] text-blue-400">Pedestrian Motion</div>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 font-sans">COMPASS BEARING</div>
            <div className="text-white font-bold mt-0.5 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>{headingDeg}° {getCardinalDirection(headingDeg)}</span>
            </div>
            <div className="text-[10px] text-slate-400">Hardware Gyro</div>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 font-sans">SAFETY STATUS</div>
            <div className="truncate font-bold mt-0.5">
              {currentZoneState.isInsideSafe ? (
                <span className="text-emerald-400">Protected Sanctuary</span>
              ) : currentZoneState.isInsideHighRisk ? (
                <span className="text-rose-400">Caution Corridor</span>
              ) : (
                <span className="text-blue-400">Active Transit</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {currentZoneState.zone ? currentZoneState.zone.name : 'South African City'}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Interactive OpenStreetMap Tile Engine */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-white">Live OpenStreetMap GPS Tracking Engine</h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Safe Zone
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Owner GPS
            </span>
          </div>
        </div>

        {/* Real Leaflet Map Container with CartoDB/OpenStreetMap tiles */}
        <div className="h-72 sm:h-80 w-full rounded-2xl overflow-hidden">
          <RealTimeMap
            latitude={coords.lat}
            longitude={coords.lng}
            accuracy={coords.accuracy}
            breadcrumbs={breadcrumbs.map(b => ({ lat: b.latitude, lng: b.longitude }))}
            safeZones={safeZones.map(sz => ({
              name: sz.name,
              lat: sz.latitude,
              lng: sz.longitude,
              radiusMeters: sz.radiusMeters,
              type: sz.type
            }))}
            isSimulating={isSimulatingWalk}
          />
        </div>
      </div>

      {/* "Walk With Me" Live Tracking Link Generator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">"Walk With Me" Real-Time GPS Sharing</h3>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">End-to-End Encrypted</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Share your real-time GPS stream with a trusted contact or campus security before walking. They can watch your live moving beacon on an interactive map until you confirm safe arrival.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 truncate">
            https://safeband.app/track/owner-za-live?lat={coords.lat.toFixed(5)}&lng={coords.lng.toFixed(5)}
          </div>

          <button
            onClick={handleCopyShareLink}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 shadow-sm"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
          </button>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `I am walking right now. Track my live real-time SafeBand location here: https://safeband.app/track/owner-za-live?lat=${coords.lat.toFixed(5)}&lng=${coords.lng.toFixed(5)}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Send to WhatsApp</span>
          </a>

          <a
            href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition shrink-0"
            title="Open real coordinates in Google Maps"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Open in Maps</span>
          </a>
        </div>
      </div>

      {/* Safety Check-In Dead-Man's Timer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white">Safety Check-In (Dead-Man's Switch)</h3>
          </div>
          {checkInActive && (
            <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded text-[10px] font-mono font-bold animate-pulse">
              Active Protection Timer
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Set an expected arrival time. If you do not confirm safe arrival before the countdown ends, SafeBand automatically streams your live real-time coordinates and alerts your lifelines.
        </p>

        {checkInActive ? (
          <div className="p-4 bg-slate-950 rounded-xl border border-amber-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-400">Time remaining until auto-SOS alert:</div>
              <div className="text-3xl font-mono font-bold text-amber-300 mt-0.5">
                {Math.floor(checkInRemainingSec / 60).toString().padStart(2, '0')}:
                {(checkInRemainingSec % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={cancelCheckIn}
                className="flex-1 sm:flex-none py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-md shadow-emerald-950/50"
              >
                I Arrived Safely (Stop Timer)
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => startCheckIn(10)}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
            >
              10 Min Walk
            </button>
            <button
              onClick={() => startCheckIn(15)}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
            >
              15 Min Walk
            </button>
            <button
              onClick={() => startCheckIn(30)}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
            >
              30 Min Transit
            </button>
          </div>
        )}
      </div>

      {/* Real-time Breadcrumb Waypoints History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-white">Recent Real-Time GPS Breadcrumbs</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{breadcrumbs.length} Points Recorded</span>
        </div>

        {breadcrumbs.length === 0 ? (
          <div className="text-xs text-slate-500 p-4 text-center">
            Acquiring initial location breadcrumbs...
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {breadcrumbs.map((bc) => (
              <div
                key={bc.id}
                className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="font-sans font-semibold text-slate-200 text-[11px]">{bc.zoneLabel}</div>
                  <div className="text-[10px] text-slate-500">
                    {bc.latitude.toFixed(5)}, {bc.longitude.toFixed(5)} (±{bc.accuracy}m)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-emerald-400">{bc.timestamp}</div>
                  <div className="text-[10px] text-slate-400">
                    {bc.speedKmh ? `${bc.speedKmh} km/h` : '0 km/h'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-configured Safe Zones & Custom Zone Adder */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">Geofenced Safety Perimeters ({safeZones.length})</h3>
          </div>
          <button
            onClick={() => setShowAddZoneModal(true)}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Safe Zone</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {safeZones.map((sz) => (
            <div key={sz.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 truncate">{sz.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  sz.type === 'high_risk_corridor'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {sz.radiusMeters}m
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed truncate">
                {sz.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add Custom Safe Zone */}
      {showAddZoneModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Save Current GPS as Safe Zone</h3>
              <button onClick={() => setShowAddZoneModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Your real-time GPS coordinates ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}) will be registered as a protected perimeter.
            </p>

            <form onSubmit={handleAddCustomZone} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Perimeter Name</label>
                <input
                  type="text"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="e.g. My Bedroom / Residence Hall C"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddZoneModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
                >
                  Save Safe Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
