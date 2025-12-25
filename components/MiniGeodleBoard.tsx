
import React from 'react';
import { GeodleMove } from '../types.ts';

interface MiniGeodleBoardProps {
  guesses: GeodleMove[];
  isFailed?: boolean;
}

const MiniGeodleBoard: React.FC<MiniGeodleBoardProps> = ({ guesses, isFailed }) => {
  const topGuesses = [...guesses].sort((a, b) => b.percentage - a.percentage).slice(0, 3);

  return (
    <div className="aspect-square w-full bg-white p-3 flex flex-col gap-2 rounded-xl border border-zinc-100 shadow-inner relative overflow-hidden">
      <div className="flex-grow flex items-center justify-center">
        <div className="relative">
          <svg className={`w-12 h-12 transition-colors ${isFailed ? 'text-red-100' : 'text-emerald-50'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          {!isFailed && guesses.some(g => g.percentage >= 99.5) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {topGuesses.map((g, i) => (
          <div key={i} className="h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${g.percentage}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniGeodleBoard;
