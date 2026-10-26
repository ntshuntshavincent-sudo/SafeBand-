import React, { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';

interface QuickExitButtonProps {
  onQuickExit: () => void;
  className?: string;
  variant?: 'floating' | 'header' | 'button';
}

export const QuickExitButton: React.FC<QuickExitButtonProps> = ({
  onQuickExit,
  className = '',
  variant = 'header',
}) => {
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);

  // Keyboard shortcut listener: Escape key triggers immediate Quick Exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        executeEmergencyExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const executeEmergencyExit = () => {
    const start = performance.now();
    // Clear any volatile audio/canvas memory
    onQuickExit();
    const duration = Math.round(performance.now() - start);
    setLastLatencyMs(duration);
  };

  if (variant === 'floating') {
    return (
      <button
        onClick={executeEmergencyExit}
        className={`fixed bottom-20 right-4 z-50 flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-lg shadow-rose-950/60 font-semibold text-xs active:scale-90 transition transform ${className}`}
        title="Panic Quick Exit (Escape key) - Wipes session memory and locks app in <150ms"
      >
        <LogOut className="w-4 h-4" />
        <span>Panic Exit</span>
      </button>
    );
  }

  return (
    <button
      onClick={executeEmergencyExit}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm active:scale-95 transition ${className}`}
      title="Panic Quick Exit (Escape key) - Instantly wipe volatile session"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>Quick Exit</span>
    </button>
  );
};
