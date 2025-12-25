
import React from 'react';
import { PlayIcon, ResetIcon, XIcon } from './icons.tsx';

interface PauseMenuProps {
  onResume: () => void;
  onExit: () => void;
  onRestart?: () => void;
  gameType: string;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onExit, onRestart, gameType }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/40 backdrop-blur-3xl" 
        onClick={onResume}
      />
      
      {/* Menu Card */}
      <div className="relative bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-[0_32px_80px_rgba(0,0,0,0.15)] border border-zinc-200 animate-pop-in">
        <h2 className="text-4xl font-black tracking-tighter text-black mb-2 uppercase text-center">Paused</h2>
        <p className="text-[10px] font-black text-zinc-400 tracking-[0.4em] uppercase text-center mb-12">
          {gameType}
        </p>

        <div className="flex flex-col gap-4">
          <button 
            onClick={onResume}
            className="w-full flex items-center justify-between px-8 py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest text-[12px] shadow-xl active:scale-[0.98] transition-transform"
          >
            <span>Resume Game</span>
            <PlayIcon className="w-5 h-5" />
          </button>

          <button 
            onClick={onRestart}
            className="w-full flex items-center justify-between px-8 py-6 bg-zinc-100 text-zinc-900 rounded-[2rem] font-black uppercase tracking-widest text-[12px] active:scale-[0.98] transition-transform"
          >
            <span>Restart</span>
            <ResetIcon className="w-5 h-5" />
          </button>

          <div className="h-[1px] bg-zinc-100 my-2" />

          <button 
            onClick={onExit}
            className="w-full flex items-center justify-between px-8 py-6 bg-red-50 text-red-600 rounded-[2rem] font-black uppercase tracking-widest text-[12px] active:scale-[0.98] transition-transform"
          >
            <span>Exit to Menu</span>
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PauseMenu;
