import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Lock, 
  MapPin, 
  ShieldCheck, 
  Radio, 
  Trophy, 
  LogOut, 
  Layers, 
  EyeOff
} from 'lucide-react';
import { AppMode, EvidenceItem, EmergencyContact, SOSDistressSignal, UserProfile } from '../types';
import { SilentSosView } from './views/SilentSosView';
import { LiveLocationTracker } from './views/LiveLocationTracker';
import { EvidenceVaultView } from './views/EvidenceVaultView';
import { SupportDirectoryView } from './views/SupportDirectoryView';
import { SecurityAuditView } from './views/SecurityAuditView';
import { ResponderConsoleView } from './views/ResponderConsoleView';
import { PredictiveIntelligenceView } from './views/PredictiveIntelligenceView';
import { QuickExitButton } from './QuickExitButton';
import { INITIAL_EMERGENCY_CONTACTS } from '../utils/directoryData';
import { Navigation, Cpu, User } from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';

interface SafeBandDashboardProps {
  onQuickExit: () => void;
  onOpenDuress: () => void;
  currentUser?: UserProfile | null;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

export const SafeBandDashboard: React.FC<SafeBandDashboardProps> = ({
  onQuickExit,
  onOpenDuress,
  currentUser,
  onOpenProfile,
  onLogout,
}) => {
  const { currentSurvivorSignal, cancelActiveSos, status: connStatus } = useRealtime();
  const [activeTab, setActiveTab] = useState<'sos' | 'tracker' | 'intelligence' | 'vault' | 'directory' | 'security' | 'responder'>('sos');
  const [contacts, setContacts] = useState<EmergencyContact[]>(
    currentUser?.contacts && currentUser.contacts.length > 0 ? currentUser.contacts : INITIAL_EMERGENCY_CONTACTS
  );

  React.useEffect(() => {
    if (currentUser?.contacts && currentUser.contacts.length > 0) {
      setContacts(currentUser.contacts);
    }
  }, [currentUser]);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([
    {
      id: 'EV-INIT-001',
      type: 'note',
      title: 'Initial Safety Assessment & Campus Route Notes',
      timestamp: '2026-10-14T19:30:00Z',
      sha256Hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      ivHex: '4a1290fe7b31',
      encryptedPayload: '9f018e...[AES-256-SEALED]',
      fileSizeBytes: 1420,
      legalMetadata: {
        deviceFingerprint: 'SM-A546E-ZA-PROT-V4',
        geotag: {
          lat: -26.1834,
          lng: 28.0007,
          accuracyMeters: 4.0,
          zoneLabel: 'Auckland Park Kingsway Campus Gate 2'
        },
        chainOfCustodyId: 'ZA-GBV-VAULT-20261014-998A',
        hashAlgorithm: 'SHA-256',
        encryptionAlgorithm: 'AES-256-GCM'
      }
    }
  ]);

  const activeSosSignal = currentSurvivorSignal;

  const handleAddEvidence = (item: EvidenceItem) => {
    setEvidenceList(prev => [item, ...prev]);
  };

  const handlePurgeMemory = () => {
    setEvidenceList([]);
  };

  const handleSosTriggered = () => {
    // Handled by RealtimeContext inside SilentSosView
  };

  const handleCancelSos = () => {
    cancelActiveSos();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      {/* Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (Clean single-line links) - Zone 3 (Quick Exit CTA) */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              SafeBand
            </span>
          </div>
          <ConnectionStatusBadge status={connStatus} />
        </div>

        {/* Zone 2: Concise navigation tabs (Desktop / Tablet) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('sos')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'sos' ? 'text-rose-400 font-semibold' : ''
            }`}
          >
            Silent SOS
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`whitespace-nowrap transition-colors hover:text-white flex items-center gap-1.5 ${
              activeTab === 'tracker' ? 'text-rose-400 font-semibold' : ''
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Tracking
          </button>
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`whitespace-nowrap transition-colors hover:text-white flex items-center gap-1.5 ${
              activeTab === 'intelligence' ? 'text-indigo-400 font-semibold' : ''
            }`}
            title="Criterion 7: AI Autonomous Safety & Pattern Forecasting"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Intelligence</span>
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'vault' ? 'text-rose-400 font-semibold' : ''
            }`}
          >
            Evidence Vault
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'directory' ? 'text-rose-400 font-semibold' : ''
            }`}
          >
            Support Directory
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'security' ? 'text-rose-400 font-semibold' : ''
            }`}
          >
            SSDLC Security
          </button>
          <button
            onClick={() => setActiveTab('responder')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'responder' ? 'text-rose-400 font-semibold' : ''
            }`}
          >
            Responder Console
          </button>
        </nav>

        {/* Zone 3: User Details, Primary Action (Panic Quick Exit) & Duress View */}
        <div className="flex items-center gap-2 shrink-0">
          {currentUser && (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
              title="Click to view/edit your emergency lifelines and personal profile"
            >
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline font-semibold">{currentUser.fullName}</span>
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">({currentUser.phone})</span>
            </button>
          )}

          <button
            onClick={onOpenDuress}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
            title="Simulate entering Duress PIN 9999"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Duress View</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg text-xs transition cursor-pointer"
              title="Sign Out / Switch User Account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

          <QuickExitButton onQuickExit={onQuickExit} />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6">
        {/* Mobile Sub-Navigation Pills (if on small screen) */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 text-xs">
          <button
            onClick={() => setActiveTab('sos')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'sos' ? 'bg-rose-600 text-white font-medium' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Silent SOS
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1 ${
              activeTab === 'tracker' ? 'bg-rose-600 text-white font-medium' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Track Location
          </button>
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1 font-medium ${
              activeTab === 'intelligence' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-slate-900 text-indigo-300 border border-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            AI Intelligence
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'vault' ? 'bg-rose-600 text-white font-medium' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Evidence Vault
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'directory' ? 'bg-rose-600 text-white font-medium' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Directory (PEP/Shelters)
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'security' ? 'bg-rose-600 text-white font-medium' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Security SSDLC
          </button>
          <button
            onClick={() => setActiveTab('responder')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'responder' ? 'bg-rose-600 text-white font-medium' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Campus Console
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'sos' && (
          <SilentSosView
            contacts={contacts}
            onSosTriggered={handleSosTriggered}
            activeSosSignal={activeSosSignal}
            onCancelSos={handleCancelSos}
            currentUser={currentUser}
            onOpenProfile={onOpenProfile}
          />
        )}

        {activeTab === 'tracker' && (
          <LiveLocationTracker
            currentUser={currentUser}
            onTriggerEmergencySos={(loc) => {
              setActiveTab('sos');
            }}
          />
        )}

        {activeTab === 'intelligence' && (
          <PredictiveIntelligenceView
            onTriggerSos={() => setActiveTab('sos')}
          />
        )}

        {activeTab === 'vault' && (
          <EvidenceVaultView
            evidenceList={evidenceList}
            onAddEvidence={handleAddEvidence}
            onPurgeVolatileMemory={handlePurgeMemory}
          />
        )}

        {activeTab === 'directory' && (
          <SupportDirectoryView />
        )}

        {activeTab === 'security' && (
          <SecurityAuditView />
        )}

        {activeTab === 'responder' && (
          <ResponderConsoleView />
        )}
      </main>

      {/* Floating Panic Exit trigger for rapid thumb reach */}
      <QuickExitButton variant="floating" onQuickExit={onQuickExit} />

      {/* Mobile Fixed Bottom Navigation Bar (Pattern 1 from 10_mobile_touch_apps.md) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-5 items-center h-16 pb-safe">
        <button
          onClick={() => setActiveTab('sos')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'sos' ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Silent SOS</span>
        </button>

        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'tracker' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Track</span>
        </button>

        <button
          onClick={() => setActiveTab('intelligence')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'intelligence' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">AI Guard</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'vault' ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Vault</span>
        </button>

        <button
          onClick={() => setActiveTab('responder')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'responder' ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Console</span>
        </button>
      </div>
    </div>
  );
};
