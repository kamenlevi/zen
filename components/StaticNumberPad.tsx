import React from 'react';
import { EraseIcon } from './icons.tsx';

interface StaticNumberPadProps {
  onNumberSelect: (num: number) => void;
  onErase: () => void;
  show: boolean;
}

const StaticNumberPad: React.FC<StaticNumberPadProps> = ({ onNumberSelect, onErase, show }) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className={`w-full transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className="flex justify-between items-center gap-2.5 px-1 py-3 overflow-x-auto no-scrollbar">
        {numbers.map((num) => (
          <button
            key={num}
            onClick={() => onNumberSelect(num)}
            className="flex-1 h-16 min-w-[38px] flex items-center justify-center text-2xl font-bold text-zinc-900 bg-zinc-50 rounded-2xl border border-zinc-100 shadow-sm active:bg-zinc-900 active:text-white transition-all active:scale-[0.88]"
          >
            {num}
          </button>
        ))}
        <button
          onClick={onErase}
          className="flex-1 h-16 min-w-[50px] flex items-center justify-center text-red-300 bg-red-50/50 rounded-2xl border border-red-50 shadow-sm active:bg-red-400 active:text-white transition-all active:scale-[0.88]"
          aria-label="Erase"
        >
          <EraseIcon />
        </button>
      </div>
    </div>
  );
};

export default StaticNumberPad;