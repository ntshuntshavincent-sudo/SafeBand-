import React, { useState, useEffect } from 'react';
import { AppMode } from './types';
import { DuressModeView } from './components/DuressModeView';
import { SafeBandDashboard } from './components/SafeBandDashboard';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { SecurityAuditView } from './components/views/SecurityAuditView';
import { ResponderConsoleView } from './components/views/ResponderConsoleView';
import { LiveTrackerPublicView } from './components/views/LiveTrackerPublicView';
import { AuthView } from './components/auth/AuthView';
import { ProfileEditModal } from './components/auth/ProfileEditModal';
import { userService } from './services/userService';
import { UserProfile } from './types';
import { RealtimeProvider, useRealtime } from './context/RealtimeContext';
import { ConnectionStatusBadge } from './components/ConnectionStatusBadge';
import { 
  ShieldAlert, 
  EyeOff, 
  Radio, 
  ShieldCheck, 
  WifiOff, 
  ArrowLeft,
  User,
  LogOut,
  SlidersHorizontal
} from 'lucide-react';

function getTrackingTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  // Check hash route like #/track/abc12345
  const hash = window.location.hash;
  if (hash.startsWith('#/track/')) {
    return hash.replace('#/track/', '').split('?')[0];
  }
  // Check path route like /track/abc12345
  const path = window.location.pathname;
  if (path.startsWith('/track/')) {
    return path.replace('/track/', '').split('?')[0];
  }
  // Check search param ?track=abc12345
  const params = new URLSearchParams(window.location.search);
  const trackParam = params.get('track');
  if (trackParam) return trackParam;

  return null;
}

function AppContent() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => userService.getCurrentUser());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeMode, setActiveMode] = useState<AppMode>('safeband');
  const [trackingToken, setTrackingToken] = useState<string | null>(getTrackingTokenFromUrl());
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const { status: connStatus, role, setRole, activeIncidents } = useRealtime();

  // Listen to URL changes for tracking links
  useEffect(() => {
    const handleUrlChange = () => {
      setTrackingToken(getTrackingTokenFromUrl());
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register service worker if supported
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Sync role with selected mode
  const handleSelectMode = (mode: AppMode) => {
    setActiveMode(mode);
    if (mode === 'responder_console') {
      setRole('responder');
    } else if (mode === 'safeband') {
      setRole('survivor');
    }
  };

  // Logout handler
  const handleLogout = () => {
    userService.logout();
    setCurrentUser(null);
    setActiveMode('safeband');
  };

  // Panic Quick Exit - Clears volatile memory and resets safely to default SafeBand view
  const handleQuickExit = () => {
    setActiveMode('safeband');
    setRole('survivor');
    if (trackingToken) {
      window.location.hash = '';
      setTrackingToken(null);
    }
  };

  // If a public tracking token is present in the URL, render tracker without login
  if (trackingToken) {
    return (
      <LiveTrackerPublicView
        token={trackingToken}
        onExit={handleQuickExit}
      />
    );
  }

  // App must start on the interface that allows user to log in or register
  if (!currentUser) {
    return (
      <AuthView
        onAuthenticated={(user) => {
          setCurrentUser(user);
          setActiveMode('safeband');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode — Telemetry Queued in IndexedDB Buffer</span>
        </div>
      )}

      {/* PWA Install Banner */}
      <PWAInstallPrompt />

      {/* Primary Navigation & Student Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs overflow-x-auto gap-3">
        <div className="flex items-center gap-2.5 text-slate-300 shrink-0 font-bold tracking-tight">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="hidden sm:inline">SafeBand Platform:</span>
          <ConnectionStatusBadge status={connStatus} />
        </div>

        {/* Center: Role Switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => handleSelectMode('safeband')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium cursor-pointer ${
              activeMode === 'safeband' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Survivor Vault & SOS</span>
          </button>

          <button
            onClick={() => handleSelectMode('responder_console')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium relative cursor-pointer ${
              activeMode === 'responder_console' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Campus Responder Console</span>
            {activeIncidents.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          <button
            onClick={() => handleSelectMode('security_audit')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium cursor-pointer ${
              activeMode === 'security_audit' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">SSDLC Security & STRIDE</span>
            <span className="md:hidden">SSDLC</span>
          </button>

          <button
            onClick={() => handleSelectMode('duress')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium cursor-pointer ${
              activeMode === 'duress' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
            }`}
            title="Simulate entering Duress PIN under coercion"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Anti-Coercion Mode</span>
            <span className="md:hidden">Duress</span>
          </button>
        </div>

        {/* Right: Logged-in User Pill & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
            title="Edit student profile, lifelines, and location"
          >
            <User className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-semibold">{currentUser.fullName}</span>
            <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">({currentUser.phone})</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-lg text-xs transition cursor-pointer"
            title="Sign Out / Switch Account"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Profile & Lifelines Modal */}
      <ProfileEditModal
        user={currentUser}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpdate={(updated) => setCurrentUser(updated)}
      />

      {/* Screen Render according to Mode */}
      <div className="flex-1">
        {activeMode === 'safeband' && (
          <SafeBandDashboard
            onQuickExit={handleQuickExit}
            onOpenDuress={() => handleSelectMode('duress')}
            currentUser={currentUser}
            onOpenProfile={() => setShowProfileModal(true)}
            onLogout={handleLogout}
          />
        )}

        {activeMode === 'duress' && (
          <DuressModeView
            onBackToCalculator={handleQuickExit}
          />
        )}

        {activeMode === 'responder_console' && (
          <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleQuickExit}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Survivor Vault & SOS</span>
              </button>
            </div>
            <ResponderConsoleView />
          </div>
        )}

        {activeMode === 'security_audit' && (
          <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleQuickExit}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Survivor Vault & SOS</span>
              </button>
            </div>
            <SecurityAuditView />
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <RealtimeProvider>
      <AppContent />
    </RealtimeProvider>
  );
}
