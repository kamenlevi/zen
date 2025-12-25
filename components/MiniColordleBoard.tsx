
import React from 'react';
import { ColordleMove } from '../types.ts';

interface MiniColordleBoardProps {
  guesses: ColordleMove[];
  targetColor: string;
  hideTarget?: boolean;
}

const MiniColordleBoard: React.FC<MiniColordleBoardProps> = ({ guesses, targetColor, hideTarget }) => {
  // Take top 4 guesses by similarity percentage
  const latestGuesses = [...guesses].sort((a, b) => b.percentage - a.percentage).slice(0, 4);

  return (
    <div className="aspect-square w-full bg-white p-2 flex flex-col gap-2 rounded-xl border border-zinc-100 shadow-inner">
      <div 
        className={`flex-grow rounded-lg shadow-inner border border-zinc-200 flex items-center justify-center overflow-hidden ${hideTarget ? 'bg-zinc-100' : ''}`}
        style={hideTarget ? {} : { backgroundColor: targetColor }}
      >
        {hideTarget && <span className="text-zinc-300 font-black text-2xl">?</span>}
      </div>
      <div className="flex gap-1 h-6">
        {Array.from({ length: 4 }).map((_, i) => {
            const guess = latestGuesses[i];
            return (
                <div 
                    key={i} 
                    className={`flex-1 rounded-sm border border-zinc-50 ${guess ? '' : 'bg-zinc-50'}`}
                    style={guess ? { backgroundColor: guess.guessHex } : {}}
                />
            );
        })}
      </div>
    </div>
  );
};

export default MiniColordleBoard;
