
import React from 'react';
import { WordleStatus } from '../types.ts';
import { BackspaceIcon } from './icons.tsx';

interface WordleKeyboardProps {
  onKey: (key: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  keyStatus: Record<string, WordleStatus>;
  validating?: boolean;
}

const ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const ROW_3 = [ 'ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE'];

const WordleKeyboard: React.FC<WordleKeyboardProps> = ({ onKey, onEnter, onDelete, keyStatus, validating }) => {
  const renderKey = (key: string) => {
    let colorClasses = '';
    const status = keyStatus[key];
    const isControl = key === 'ENTER' || key === 'DELETE';

    if (isControl) {
      colorClasses = 'bg-zinc-200 text-zinc-900 border-zinc-300 active:bg-zinc-900 active:text-white shadow-sm';
    } else {
      if (status === 'correct') colorClasses = 'bg-emerald-600 text-white border-emerald-600';
      else if (status === 'present') colorClasses = 'bg-amber-500 text-white border-amber-500';
      else if (status === 'absent') colorClasses = 'bg-zinc-400 text-white border-zinc-400';
      else colorClasses = 'bg-zinc-100 text-zinc-900 border-zinc-200';
    }

    const handleAction = (e: React.PointerEvent) => {
      e.preventDefault();
      if (validating && key === 'ENTER') return;
      if (key === 'ENTER') onEnter();
      else if (key === 'DELETE') onDelete();
      else onKey(key);
    };

    const isDelete = key === 'DELETE';
    const isEnter = key === 'ENTER';

    return (
      <button
        key={key}
        onPointerDown={handleAction}
        className={`
          flex-1 h-[66px] sm:h-18 flex items-center justify-center rounded-lg font-black transition-all active:scale-[0.9] border touch-manipulation
          ${isDelete || isEnter ? 'flex-[1.6] text-[10px] sm:text-[12px] tracking-widest' : 'text-[17px] sm:text-xl'}
          ${colorClasses}
          ${validating && isEnter ? 'opacity-50' : ''}
        `}
      >
        {isDelete ? (
          <BackspaceIcon className="w-8 h-8" />
        ) : isEnter ? (
          validating ? (
            <div className="w-6 h-6 border-3 border-zinc-400 border-t-zinc-900 rounded-full animate-spin"></div>
          ) : (
            'ENTER'
          )
        ) : key}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-md mx-auto px-1 select-none touch-manipulation">
      <div className="flex gap-1 justify-center w-full">
        {ROW_1.map(k => renderKey(k))}
      </div>
      <div className="flex gap-1 justify-center w-[92%] mx-auto">
        {ROW_2.map(k => renderKey(k))}
      </div>
      <div className="flex gap-1 justify-center w-full">
        {ROW_3.map(k => renderKey(k))}
      </div>
    </div>
  );
};

export default WordleKeyboard;
