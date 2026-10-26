import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({ status, className = '' }) => {
  if (status === 'connected') {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/80 ${className}`}
        title="Real-Time WebSocket Link Active with Campus Dispatch Center"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Connected (WSS)</span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-amber-950/80 text-amber-300 border border-amber-800/80 ${className}`}
        title="Reconnecting to Dispatch Gateway..."
      >
        <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-rose-950/80 text-rose-300 border border-rose-800/80 ${className}`}
      title="Offline — Telemetry queued in IndexedDB buffer"
    >
      <WifiOff className="w-3 h-3 text-rose-400" />
      <span>Offline (Buffered)</span>
    </div>
  );
};
