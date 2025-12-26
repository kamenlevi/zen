
import React, { useEffect } from 'react';
import { PlayIcon, ResetIcon, XIcon, ChevronLeftIcon } from './icons.tsx';

interface PauseMenuProps {
  onResume: () => void;
  onExit: () => void;
  onRestart?: () => void;
  gameType: string;
  notes?: string;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onExit, onRestart, gameType, notes }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onResume();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onResume]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/40 backdrop-blur-3xl" 
        onClick={onResume}
      />
      
      {/* Menu Card */}
      <div className="relative bg-white w-full max-w-sm rounded-[4rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.2)] border border-zinc-200 animate-pop-in">
        <div className="absolute top-10 left-10">
           <button onClick={onResume} className="p-4 bg-zinc-50 rounded-full active:scale-90 transition-transform shadow-sm">
              <ChevronLeftIcon className="w-8 h-8 text-black" />
           </button>
        </div>

        <h2 className="text-5xl font-black tracking-tighter text-black mb-2 uppercase text-center mt-12">Paused</h2>
        <p className="text-[11px] font-black text-zinc-400 tracking-[0.5em] uppercase text-center mb-4">
          {gameType}
        </p>

        {notes && (
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 mb-8">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-1">Your Notes</p>
                <p className="text-sm text-zinc-800 leading-tight">{notes}</p>
            </div>
        )}

        <div className="flex flex-col gap-5">
          <button 
            onClick={onResume}
            className="w-full flex items-center justify-between px-10 py-7 bg-black text-white rounded-full font-black uppercase tracking-widest text-[14px] shadow-2xl active:scale-[0.98] transition-transform"
          >
            <span>Resume</span>
            <PlayIcon className="w-8 h-8" />
          </button>

          <button 
            onClick={onRestart}
            className="w-full flex items-center justify-between px-10 py-7 bg-zinc-100 text-zinc-900 rounded-full font-black uppercase tracking-widest text-[14px] active:scale-[0.98] transition-transform shadow-sm"
          >
            <span>Restart</span>
            <ResetIcon className="w-8 h-8" />
          </button>

          <div className="h-[1px] bg-zinc-100 my-4" />

          <button 
            onClick={onExit}
            className="w-full flex items-center justify-between px-10 py-7 bg-red-50 text-red-600 rounded-full font-black uppercase tracking-widest text-[14px] active:scale-[0.98] transition-transform"
          >
            <span>Exit Menu</span>
            <XIcon className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PauseMenu;
