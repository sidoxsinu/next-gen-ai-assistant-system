import React from 'react';
import { AIProvider } from '../types';

interface HeaderProps {
  provider: AIProvider;
  activeModelDisplay: string;
  sessionTime: number;
  formatTime: (sec: number) => string;
  tokenCount: number;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  scanlineEnabled: boolean;
  setScanlineEnabled: (val: boolean) => void;
  onOpenSettings: () => void;
  onResetKey: () => void;
  onOpenTour?: () => void;
}

export function Header({
  provider,
  activeModelDisplay,
  sessionTime,
  formatTime,
  tokenCount,
  isDarkMode,
  setIsDarkMode,
  scanlineEnabled,
  setScanlineEnabled,
  onOpenSettings,
  onResetKey,
  onOpenTour
}: HeaderProps) {
  return (
    <header className="bg-[#FFE600] border-black border-b-[3px] p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div data-tour="header-telemetry">
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase m-0 leading-tight">
          NEXT-GEN AI ASSISTANT SYSTEM
        </h1>
        <div className="flex gap-2 flex-wrap items-center mt-2">
          <span className="inline-flex items-center gap-1 bg-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase">
            <span
              className={`w-2 h-2 rounded-full ${
                provider === 'GEMINI' ? 'bg-[#0047FF]' : provider === 'GROQ' ? 'bg-[#FF2D00]' : 'bg-green-500'
              }`}
            ></span>
            KERNEL: {provider} / {activeModelDisplay}
          </span>
          <span className="inline-block bg-black text-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase">
            SESSION: {formatTime(sessionTime)}
          </span>
          <span className="inline-block bg-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase">
            TOKENS: {tokenCount}/4096
          </span>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="bg-white hover:bg-black hover:text-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase cursor-pointer"
          >
            {isDarkMode ? 'LIGHT_MODE' : 'DARK_MODE'}
          </button>
          <button
            onClick={() => setScanlineEnabled(!scanlineEnabled)}
            className="bg-white hover:bg-[#FF2D00] hover:text-white border-[3px] border-black px-3 py-1 text-[0.65rem] font-bold uppercase cursor-pointer"
          >
            SCANLINE: {scanlineEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap" data-tour="header-settings">
        {onOpenTour && (
          <button
            onClick={onOpenTour}
            className="bg-[#0047FF] text-white hover:bg-black hover:text-[#FFE600] border-[3px] border-black px-3 py-2 text-xs font-black uppercase cursor-pointer transition-colors active:translate-y-1 shadow-[2px_2px_0_#000]"
          >
            [? SYSTEM_TOUR]
          </button>
        )}
        <button
          onClick={onOpenSettings}
          className="bg-black text-[#FFE600] hover:bg-white hover:text-black border-[3px] border-black px-3 py-2 text-xs font-black uppercase cursor-pointer transition-colors active:translate-y-1"
        >
          [⚙ AI_KERNEL_SETTINGS]
        </button>
        <button
          onClick={onResetKey}
          className="bg-white hover:bg-[#FF2D00] hover:text-white text-black border-[3px] border-black px-3 py-2 text-xs font-bold uppercase cursor-pointer transition-colors active:translate-y-1"
        >
          [RESET_KEY]
        </button>
        <div className="hidden xl:block bg-[#0047FF] text-white border-[3px] border-black px-3 py-2 text-xs font-bold uppercase">
          ACTIVE: {provider}
        </div>
      </div>
    </header>
  );
}
