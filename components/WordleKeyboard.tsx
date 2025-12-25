
import React from 'react';
import { WordleStatus } from '../types.ts';

interface WordleKeyboardProps {
  onKey: (key: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  keyStatus: Record<string, WordleStatus>;
  validating?: boolean;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE'],
];

const WordleKeyboard: React.FC<WordleKeyboardProps> = ({ onKey, onEnter, onDelete, keyStatus, validating }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full max-w-lg mx-auto px-1 select-none">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1 justify-center">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'DELETE';
            let colorClasses = '';

            if (isSpecial) {
              colorClasses = 'bg-zinc-200 text-zinc-900 border-zinc-300 active:bg-zinc-900 active:text-white';
            } else {
              const status = keyStatus[key];
              if (status === 'correct') colorClasses = 'bg-emerald-600 text-white border-emerald-600';
              else if (status === 'present') colorClasses = 'bg-amber-500 text-white border-amber-500';
              else if (status === 'absent') colorClasses = 'bg-zinc-400 text-white border-zinc-400';
              else colorClasses = 'bg-zinc-100 text-zinc-900 border-zinc-200';
            }

            return (
              <button
                key={key}
                disabled={validating && key === 'ENTER'}
                onClick={() => {
                  if (key === 'ENTER') onEnter();
                  else if (key === 'DELETE') onDelete();
                  else onKey(key);
                }}
                className={`
                  flex-1 h-14 sm:h-16 flex items-center justify-center rounded-lg font-black transition-all active:scale-95 border
                  ${isSpecial ? 'px-2 text-[10px] min-w-[65px] sm:min-w-[80px] uppercase tracking-tighter' : 'text-sm sm:text-lg'}
                  ${colorClasses}
                  ${validating && key === 'ENTER' ? 'opacity-50' : ''}
                `}
              >
                {key === 'DELETE' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L21 9.828a2 2 0 000-2.828L13.414 3.586a2 2 0 00-2.828 0L3 12z" />
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
          })}
        </div>
      ))}
    </div>
  );
};

export default WordleKeyboard;
