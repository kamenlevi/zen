
import React from 'react';
import { BackspaceIcon, UndoIcon, RedoIcon, ResetIcon } from './icons.tsx';

interface StaticNumberPadProps {
  onNumberSelect: (num: number) => void;
  onErase: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  show: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

const StaticNumberPad: React.FC<StaticNumberPadProps> = ({ 
  onNumberSelect, 
  onErase, 
  onUndo, 
  onRedo, 
  onReset, 
  show,
  canUndo,
  canRedo
}) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className={`w-full transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-100'}`}>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center gap-1.5 px-1 py-1 overflow-x-auto no-scrollbar">
          {numbers.map((num) => (
            <button
              key={num}
              onClick={() => onNumberSelect(num)}
              className="flex-1 h-14 min-w-[34px] flex items-center justify-center text-xl font-black text-zinc-900 bg-zinc-50 rounded-xl border border-zinc-100 shadow-sm active:bg-zinc-900 active:text-white transition-all active:scale-[0.88]"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onErase}
            className="flex-1 h-14 min-w-[44px] flex items-center justify-center text-red-400 bg-red-50/50 rounded-xl border border-red-100 shadow-sm active:bg-red-500 active:text-white transition-all active:scale-[0.88]"
            aria-label="Erase"
          >
            <BackspaceIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-2 px-1">
          <button 
            onClick={onUndo} 
            disabled={!canUndo}
            className="flex-1 py-3 bg-zinc-100 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 disabled:opacity-30 active:scale-95 transition-all border border-zinc-200"
          >
            <UndoIcon className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          <button 
            onClick={onRedo} 
            disabled={!canRedo}
            className="flex-1 py-3 bg-zinc-100 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 disabled:opacity-30 active:scale-95 transition-all border border-zinc-200"
          >
            <RedoIcon className="w-3.5 h-3.5" />
            <span>Redo</span>
          </button>
          <button 
            onClick={onReset} 
            className="flex-1 py-3 bg-zinc-100 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 active:scale-95 transition-all border border-zinc-200"
          >
            <ResetIcon className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaticNumberPad;
