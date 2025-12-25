
import React from 'react';
import { WordleStatus } from '../types.ts';

interface WordleBoardProps {
  guesses: string[];
  results: WordleStatus[][];
  currentGuess: string;
  wordLength: number;
  maxGuesses: number;
}

const WordleBoard: React.FC<WordleBoardProps> = ({ guesses, results, currentGuess, wordLength, maxGuesses }) => {
  const rows = Array.from({ length: maxGuesses });

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 w-full items-center px-4 overflow-x-hidden no-scrollbar py-4 flex-shrink transition-all animate-fade-in">
      {rows.map((_, i) => {
        const guess = guesses[i] || (i === guesses.length ? currentGuess : '');
        const result = results[i];
        const isCurrent = i === guesses.length;

        return (
          <div key={i} className="flex gap-1.5 sm:gap-2 justify-center w-full">
            {Array.from({ length: wordLength }).map((_, j) => {
              const char = guess[j] || '';
              const status = result ? result[j] : 'tbd';

              let bgColor = 'bg-white border-zinc-200';
              let textColor = 'text-black';

              if (status === 'correct') {
                bgColor = 'bg-emerald-600 border-emerald-600';
                textColor = 'text-white';
              } else if (status === 'present') {
                bgColor = 'bg-amber-500 border-amber-500';
                textColor = 'text-white';
              } else if (status === 'absent') {
                bgColor = 'bg-zinc-400 border-zinc-400';
                textColor = 'text-white';
              } else if (isCurrent && char) {
                bgColor = 'bg-white border-zinc-900 scale-[1.05] shadow-sm';
              }

              return (
                <div
                  key={j}
                  className={`
                    w-[min(14vw,62px)] h-[min(14vw,62px)] sm:w-[76px] sm:h-[76px]
                    flex-shrink flex items-center justify-center 
                    text-xl sm:text-4xl font-black uppercase rounded-none border-2 transition-all duration-300
                    ${bgColor} ${textColor}
                    ${!char && !result ? 'opacity-30' : ''}
                  `}
                >
                  {char}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default WordleBoard;
