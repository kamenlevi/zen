
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

  const handlePointer = (fn: () => void) => (e: React.PointerEvent) => {
    e.preventDefault();
    fn();
  };

  return (
    <div className={`w-full transition-all duration-300 touch-manipulation ${show ? 'opacity-100 translate-y-0' : 'opacity-100'}`}>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center gap-1.5 px-0.5 py-1 overflow-x-auto no-scrollbar">
          {numbers.map((num) => (
            <button
              key={num}
              onPointerDown={handlePointer(() => onNumberSelect(num))}
              className="flex-1 h-14 min-w-[36px] flex items-center justify-center text-xl font-black text-zinc-900 bg-zinc-50 rounded-xl border border-zinc-100 shadow-sm active:bg-zinc-900 active:text-white transition-all active:scale-[0.85] touch-manipulation"
            >
              {num}
            </button>
          ))}
          <button
            onPointerDown={handlePointer(onErase)}
            className="flex-1 h-14 min-w-[48px] flex items-center justify-center text-red-500 bg-red-50/50 rounded-xl border border-red-100 shadow-sm active:bg-red-500 active:text-white transition-all active:scale-[0.85] touch-manipulation"
            aria-label="Erase"
          >
            <BackspaceIcon className="w-8 h-8" />
          </button>
        </div>
        
        <div className="flex gap-2.5 px-1">
          <button 
            onPointerDown={handlePointer(onUndo)}
            disabled={!canUndo}
            className="flex-1 py-4 bg-zinc-100 rounded-xl flex items-center justify-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-600 disabled:opacity-30 active:scale-95 transition-all border border-zinc-200 touch-manipulation shadow-sm"
          >
            <UndoIcon className="w-6 h-6" />
            <span>Undo</span>
          </button>
          <button 
            onPointerDown={handlePointer(onRedo)}
            disabled={!canRedo}
            className="flex-1 py-4 bg-zinc-100 rounded-xl flex items-center justify-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-600 disabled:opacity-30 active:scale-95 transition-all border border-zinc-200 touch-manipulation shadow-sm"
          >
            <RedoIcon className="w-6 h-6" />
            <span>Redo</span>
          </button>
          <button 
            onPointerDown={handlePointer(onReset)}
            className="flex-1 py-4 bg-zinc-100 rounded-xl flex items-center justify-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-600 active:scale-95 transition-all border border-zinc-200 touch-manipulation shadow-sm"
          >
            <ResetIcon className="w-6 h-6" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaticNumberPad;
