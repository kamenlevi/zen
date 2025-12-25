
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
    <div className="flex flex-col gap-2 w-full items-center">
      {rows.map((_, i) => {
        const guess = guesses[i] || (i === guesses.length ? currentGuess : '');
        const result = results[i];
        const isCurrent = i === guesses.length;

        return (
          <div key={i} className="flex gap-2 justify-center">
            {Array.from({ length: wordLength }).map((_, j) => {
              const char = guess[j] || '';
              const status = result ? result[j] : 'tbd';

              let bgColor = 'bg-white border-zinc-200';
              let textColor = 'text-black';

              if (status === 'correct') {
                bgColor = 'bg-emerald-600 border-emerald-600 shadow-md';
                textColor = 'text-white';
              } else if (status === 'present') {
                bgColor = 'bg-amber-500 border-amber-500 shadow-md';
                textColor = 'text-white';
              } else if (status === 'absent') {
                bgColor = 'bg-zinc-500 border-zinc-500';
                textColor = 'text-white';
              } else if (isCurrent && char) {
                bgColor = 'bg-white border-black shadow-md';
              }

              return (
                <div
                  key={j}
                  className={`
                    w-[68px] h-[68px] sm:w-[72px] sm:h-[72px]
                    flex items-center justify-center 
                    text-3xl sm:text-4xl font-black uppercase rounded-none border-2 transition-all duration-300
                    ${bgColor} ${textColor}
                    ${char ? 'opacity-100' : 'opacity-40'}
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
