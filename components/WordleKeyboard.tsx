
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
    <div className="flex flex-col gap-2 w-full max-w-lg mx-auto px-2">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1.5 justify-center">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'DELETE';
            let colorClasses = '';

            if (isSpecial) {
              colorClasses = 'bg-black text-white border-black shadow-md';
            } else {
              const status = keyStatus[key];
              if (status === 'correct') colorClasses = 'bg-emerald-600 text-white border-emerald-600';
              else if (status === 'present') colorClasses = 'bg-amber-500 text-white border-amber-500';
              else if (status === 'absent') colorClasses = 'bg-zinc-500 text-white border-zinc-500';
              else colorClasses = 'bg-white text-black border-zinc-200';
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
                  flex-1 h-14 sm:h-16 flex items-center justify-center rounded-xl font-bold transition-all active:scale-90 border shadow-sm
                  ${isSpecial ? 'px-3 text-[10px] min-w-[70px]' : 'text-base sm:text-lg'}
                  ${colorClasses}
                  ${validating && key === 'ENTER' ? 'opacity-50' : ''}
                `}
              >
                {key === 'DELETE' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L21 9.828a2 2 0 000-2.828L13.414 3.586a2 2 0 00-2.828 0L3 12z" />
                  </svg>
                ) : key === 'ENTER' ? (
                  validating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-white font-black tracking-tighter">ENTER</span>
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
