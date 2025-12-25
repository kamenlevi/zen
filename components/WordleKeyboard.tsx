import React from 'react';
import { WordleStatus } from '../types.ts';

interface WordleKeyboardProps {
  onKey: (key: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  keyStatus: Record<string, WordleStatus>;
  validating?: boolean;
}

const ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'DELETE'];
const ROW_3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENTER'];

const WordleKeyboard: React.FC<WordleKeyboardProps> = ({ onKey, onEnter, onDelete, keyStatus, validating }) => {
  const renderKey = (key: string, isControl: boolean = false) => {
    let colorClasses = '';
    const status = keyStatus[key];

    if (isControl) {
      colorClasses = 'bg-zinc-200 text-zinc-900 border-zinc-300 active:bg-zinc-900 active:text-white shadow-sm';
    } else {
      if (status === 'correct') colorClasses = 'bg-emerald-600 text-white border-emerald-600';
      else if (status === 'present') colorClasses = 'bg-amber-500 text-white border-amber-500';
      else if (status === 'absent') colorClasses = 'bg-zinc-400 text-white border-zinc-400';
      else colorClasses = 'bg-zinc-100 text-zinc-900 border-zinc-200';
    }

    const handleClick = () => {
      if (key === 'ENTER') onEnter();
      else if (key === 'DELETE') onDelete();
      else onKey(key);
    };

    return (
      <button
        key={key}
        disabled={validating && key === 'ENTER'}
        onClick={handleClick}
        className={`
          flex-grow h-[60px] sm:h-14 flex items-center justify-center rounded-lg font-black transition-all active:scale-95 border
          ${key === 'DELETE' || key === 'ENTER' ? 'px-3 min-w-[64px] sm:min-w-[80px]' : 'min-w-[32px] sm:min-w-[42px] text-sm sm:text-base'}
          ${key === 'ENTER' ? 'text-[9px] tracking-widest' : ''}
          ${colorClasses}
          ${validating && key === 'ENTER' ? 'opacity-50' : ''}
        `}
      >
        {key === 'DELETE' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : key === 'ENTER' ? (
          validating ? (
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin"></div>
          ) : (
            'ENTER'
          )
        ) : key}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-lg mx-auto px-0.5 select-none pb-safe">
      <div className="flex gap-1 justify-center w-full">
        {ROW_1.map(k => renderKey(k))}
      </div>
      <div className="flex gap-1 justify-center w-full pl-1">
        {ROW_2.map(k => renderKey(k, k === 'DELETE'))}
      </div>
      <div className="flex gap-1 justify-center w-full pr-1">
        {ROW_3.map(k => renderKey(k, k === 'ENTER'))}
      </div>
    </div>
  );
};

export default WordleKeyboard;