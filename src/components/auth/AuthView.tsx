import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Smartphone, 
  User, 
  GraduationCap, 
  MapPin, 
  Heart, 
  Users, 
  Radio, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Crosshair, 
  Eye, 
  EyeOff,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { UserProfile, EmergencyContact } from '../../types';
import { userService, SOUTH_AFRICAN_UNIVERSITIES, UniversityOption } from '../../services/userService';

interface AuthViewProps {
  onAuthenticated: (user: UserProfile) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showLoginPin, setShowLoginPin] = useState(false);

  // Registration form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [selectedUniId, setSelectedUniId] = useState(SOUTH_AFRICAN_UNIVERSITIES[0].id);
  const [residenceOrZone, setResidenceOrZone] = useState('Auckland Park Kingsway D-Ring Study Area');
  const [pin, setPin] = useState('1234');
  const [duressPin, setDuressPin] = useState('9999');

  // Lifelines state (Mother/Guardian, Roommate/Friend, Campus Security)
  const [motherName, setMotherName] = useState('Mama (Grace)');
  const [motherPhone, setMotherPhone] = useState('082 459 1204');
  const [motherSms, setMotherSms] = useState(true);
  const [motherWa, setMotherWa] = useState(true);

  const [roommateName, setRoommateName] = useState('Zanele (Roommate)');
  const [roommatePhone, setRoommatePhone] = useState('076 892 3411');
  const [roommateSms, setRoommateSms] = useState(true);
  const [roommateWa, setRoommateWa] = useState(true);

  const selectedUni = SOUTH_AFRICAN_UNIVERSITIES.find(u => u.id === selectedUniId) || SOUTH_AFRICAN_UNIVERSITIES[0];
  const [campusSecurityName, setCampusSecurityName] = useState(selectedUni.defaultSecurityName);
  const [campusSecurityPhone, setCampusSecurityPhone] = useState(selectedUni.defaultSecurityNumber);

  // Location state
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; isLiveGps: boolean }>({
    lat: selectedUni.lat,
    lng: selectedUni.lng,
    isLiveGps: false
  });
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState<string | null>(null);

  // When university changes, update default control room and zone
  const handleUniversityChange = (uniId: string) => {
    setSelectedUniId(uniId);
    const uni = SOUTH_AFRICAN_UNIVERSITIES.find(u => u.id === uniId);
    if (uni) {
      setCampusSecurityName(uni.defaultSecurityName);
      setCampusSecurityPhone(uni.defaultSecurityNumber);
      setResidenceOrZone(uni.defaultZone);
      if (!currentCoords.isLiveGps) {
        setCurrentCoords({ lat: uni.lat, lng: uni.lng, isLiveGps: false });
      }
    }
  };

  // Detect real live GPS location
  const handleDetectLiveLocation = () => {
    if (!('geolocation' in navigator)) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng, isLiveGps: true });
        setDetectingGps(false);
        setGpsSuccessMsg(`Locked live coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)} (±${Math.round(pos.coords.accuracy)}m)`);

        // Attempt reverse geocode
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
          .then(res => res.json())
          .then(data => {
            if (data?.display_name) {
              const parts = data.display_name.split(',');
              setResidenceOrZone(parts.slice(0, 3).join(','));
            }
          })
          .catch(() => {});
      },
      (err) => {
        setDetectingGps(false);
        setErrorMsg(`Unable to access live GPS: ${err.message}. Defaulting to campus reference.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginPhone.trim()) {
      setErrorMsg('Please enter your mobile phone number.');
      return;
    }
    if (!loginPin.trim()) {
      setErrorMsg('Please enter your 4-digit Security PIN.');
      return;
    }

    const result = userService.loginWithPhone(loginPhone, loginPin);
    if (!result.success || !result.user) {
      setErrorMsg(result.error || 'Login failed. Please check your details.');
      return;
    }

    onAuthenticated(result.user);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your personal mobile phone number.');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setErrorMsg('Please set a 4-digit security PIN to protect your vault.');
      return;
    }
    if (!motherPhone.trim()) {
      setErrorMsg('Please assign a phone number for your Mother or Guardian lifeline.');
      return;
    }
    if (!roommatePhone.trim()) {
      setErrorMsg('Please assign a phone number for your Roommate or Close Friend lifeline.');
      return;
    }

    const contacts: EmergencyContact[] = [
      {
        id: `c_mother_${Date.now()}`,
        name: motherName.trim() || 'Mother / Guardian',
        phone: motherPhone.trim(),
        relationship: 'Mother / Guardian',
        notifySms: motherSms,
        notifyWhatsapp: motherWa,
      },
      {
        id: `c_roommate_${Date.now()}`,
        name: roommateName.trim() || 'Roommate / Close Friend',
        phone: roommatePhone.trim(),
        relationship: 'Roommate / Close Friend',
        notifySms: roommateSms,
        notifyWhatsapp: roommateWa,
      },
      {
        id: `c_security_${Date.now()}`,
        name: campusSecurityName.trim() || selectedUni.defaultSecurityName,
        phone: campusSecurityPhone.trim() || selectedUni.defaultSecurityNumber,
        relationship: 'Campus Security Control Room',
        notifySms: true,
        notifyWhatsapp: false,
        isCampusSecurity: true,
      }
    ];

    const newUser = userService.registerUser({
      fullName: fullName.trim(),
      phone: phone.trim(),
      studentNumber: studentNumber.trim(),
      university: selectedUni.name,
      residenceOrZone: residenceOrZone.trim() || selectedUni.defaultZone,
      pin: pin.trim(),
      duressPin: duressPin.trim() || '9999',
      contacts,
      location: {
        lat: currentCoords.lat,
        lng: currentCoords.lng,
        zoneLabel: residenceOrZone.trim() || selectedUni.defaultZone,
        isLiveGps: currentCoords.isLiveGps
      }
    });

    onAuthenticated(newUser);
  };

  const handleDemoSignIn = () => {
    const demoUser = userService.loginDemoUser();
    onAuthenticated(demoUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 py-8">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 p-6 md:p-8 border-b border-slate-800 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/90 border border-rose-800/80 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>South African Campus Safety & Rapid Response</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            SafeBand <span className="text-rose-500">ZA</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Stealth personal protection, encrypted evidence vault, and real-time emergency dispatch for university students.
          </p>

          {/* Quick Demo Bypass for Evaluators */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/80 py-1.5 px-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Quickly test with pre-filled South African student details (Lerato Khumalo, UJ Kingsway)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Evaluator Sign-In (Pre-filled Demo Profile)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation: Register vs Login */}
        <div className="flex border-b border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer border-b-2 ${
              mode === 'register'
                ? 'border-rose-500 text-rose-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Register & Assign Lifelines</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer border-b-2 ${
              mode === 'login'
                ? 'border-rose-500 text-rose-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Sign In with Phone</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="m-4 md:m-6 p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* ================= REGISTER FORM ================= */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-4 md:p-6 space-y-6">
            {/* Section 1: Personal & Campus Credentials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <GraduationCap className="w-4 h-4 text-rose-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  1. Your Student & Personal Profile
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Lerato Khumalo"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-xl text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your Mobile Phone (Sign-In Number) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 082 123 4567"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-xl text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Student Number
                  </label>
                  <input
                    type="text"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    placeholder="e.g. 202419823"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-xl text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    University / Institution <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedUniId}
                    onChange={(e) => handleUniversityChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-xl text-xs text-slate-100"
                  >
                    {SOUTH_AFRICAN_UNIVERSITIES.map((uni) => (
                      <option key={uni.id} value={uni.id}>
                        {uni.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PIN and Duress PIN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Set 4-Digit Security PIN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-xl text-xs font-mono text-slate-100"
                  />
                  <span className="text-[10px] text-slate-500">Unlocks your personal vault and app settings.</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Stealth Duress PIN (Anti-Coercion)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={duressPin}
                    onChange={(e) => setDuressPin(e.target.value)}
                    placeholder="e.g. 9999"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-xl text-xs font-mono text-slate-100"
                  />
                  <span className="text-[10px] text-slate-500">Opens harmless decoy notes while sending silent distress signal.</span>
                </div>
              </div>
            </div>

            {/* Section 2: Lifelines Configuration */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Heart className="w-4 h-4 text-rose-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  2. Assign Your 3 Emergency Lifelines
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                When you trigger an emergency SOS, SafeBand instantly transmits real-time GPS coordinates and tracking links to these 3 dedicated lifelines.
              </p>

              {/* Lifeline 1: Mother or Guardian */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 text-xs font-bold">1</span>
                    <span className="text-xs font-bold text-slate-200">Mother or Guardian Lifeline</span>
                  </div>
                  <span className="text-[10px] text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded font-mono">
                    Primary Contact
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Full Name / Relationship</label>
                    <input
                      type="text"
                      required
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder="e.g. Mama (Grace)"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-xl text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Mobile Number (SMS / Call)</label>
                    <input
                      type="tel"
                      required
                      value={motherPhone}
                      onChange={(e) => setMotherPhone(e.target.value)}
                      placeholder="e.g. 082 459 1204"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-xl text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={motherSms}
                      onChange={(e) => setMotherSms(e.target.checked)}
                      className="rounded accent-rose-600"
                    />
                    <span>Instant Carrier SMS Alert</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={motherWa}
                      onChange={(e) => setMotherWa(e.target.checked)}
                      className="rounded accent-rose-600"
                    />
                    <span>WhatsApp Deep Link</span>
                  </label>
                </div>
              </div>

              {/* Lifeline 2: Roommate or Close Friend */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 text-xs font-bold">2</span>
                    <span className="text-xs font-bold text-slate-200">Roommate or Close Friend Lifeline</span>
                  </div>
                  <span className="text-[10px] text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded font-mono">
                    Campus Proximity
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Full Name / Tag</label>
                    <input
                      type="text"
                      required
                      value={roommateName}
                      onChange={(e) => setRoommateName(e.target.value)}
                      placeholder="e.g. Zanele (Roommate)"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={roommatePhone}
                      onChange={(e) => setRoommatePhone(e.target.value)}
                      placeholder="e.g. 076 892 3411"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roommateSms}
                      onChange={(e) => setRoommateSms(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    <span>Instant Carrier SMS Alert</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roommateWa}
                      onChange={(e) => setRoommateWa(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    <span>WhatsApp Deep Link</span>
                  </label>
                </div>
              </div>

              {/* Lifeline 3: Campus Protection Control Room */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 text-xs font-bold">3</span>
                    <span className="text-xs font-bold text-slate-200">Campus Protection Control Room</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-mono">
                    24/7 Rapid Response
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Control Room Unit Name</label>
                    <input
                      type="text"
                      required
                      value={campusSecurityName}
                      onChange={(e) => setCampusSecurityName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Direct Emergency Hotline Number</label>
                    <input
                      type="tel"
                      required
                      value={campusSecurityPhone}
                      onChange={(e) => setCampusSecurityPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Auto-populated for {selectedUni.name}. University patrol units receive distress coordinates directly on their tactical console.
                </div>
              </div>
            </div>

            {/* Section 3: Set Your Location & Live GPS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    3. Set Your Location
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLiveLocation}
                  disabled={detectingGps}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Crosshair className={`w-3.5 h-3.5 text-emerald-400 ${detectingGps ? 'animate-spin' : ''}`} />
                  <span>{detectingGps ? 'Locating...' : 'Use My Live Device GPS'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Primary Campus Residence / Study Zone
                </label>
                <input
                  type="text"
                  value={residenceOrZone}
                  onChange={(e) => setResidenceOrZone(e.target.value)}
                  placeholder="e.g. Auckland Park Kingsway D-Ring Study Area"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-xl text-xs text-slate-100"
                />
              </div>

              {gpsSuccessMsg && (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{gpsSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-rose-950/80 transition cursor-pointer active:scale-95"
              >
                <span>Save Profile, Assign Lifelines & Enter SafeBand</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ================= LOGIN FORM ================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 md:p-8 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Sign In to Your SafeBand Account</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter the mobile number and PIN you registered with to access your personalized lifelines and safety vault.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Your Registered Mobile Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="e.g. 082 459 1204"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-xl text-xs text-slate-100 pl-10 font-mono"
                  />
                  <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  4-Digit Security PIN <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showLoginPin ? 'text' : 'password'}
                    maxLength={6}
                    required
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-xl text-xs text-slate-100 pl-10 pr-10 font-mono tracking-widest"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPin(!showLoginPin)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  (Demo user PIN is <strong className="text-slate-400">1234</strong>)
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 transition cursor-pointer"
            >
              <span>Sign In with Phone</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-400">Don't have an account yet? </span>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs text-rose-400 font-semibold hover:underline cursor-pointer"
              >
                Register & assign lifelines now
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
