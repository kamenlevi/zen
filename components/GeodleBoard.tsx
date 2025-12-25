
import React, { useMemo } from 'react';
import { GeodleMove } from '../types.ts';

interface GeodleBoardProps {
  guesses: GeodleMove[];
}

const GeodleBoard: React.FC<GeodleBoardProps> = ({ guesses }) => {
  const { latestGuess, sortedOthers } = useMemo(() => {
    if (guesses.length === 0) return { latestGuess: null, sortedOthers: [] };
    
    const latest = guesses[guesses.length - 1];
    const others = guesses.slice(0, -1);
    const sorted = others.sort((a, b) => b.percentage - a.percentage);
    
    return { latestGuess: latest, sortedOthers: sorted };
  }, [guesses]);

  if (guesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 opacity-40">
        <div className="w-12 h-12 border-2 border-dashed border-zinc-900 rounded-full mb-4 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700 text-center">Enter a country to start<br/>exploring the world</p>
      </div>
    );
  }

  const getDirectionArrow = (dir: string) => {
    const arrows: Record<string, string> = {
      'N': '↑', 'NE': '↗', 'E': '→', 'SE': '↘',
      'S': '↓', 'SW': '↙', 'W': '←', 'NW': '↖'
    };
    return arrows[dir] || dir;
  };

  const renderGuessCard = (guess: GeodleMove, isLatest: boolean, index: number) => (
    <div 
      key={guess.timestamp} 
      className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all animate-pop-in relative overflow-hidden
        ${isLatest ? 'bg-zinc-900 border-zinc-800 shadow-xl' : 'bg-white border-zinc-100 shadow-sm opacity-80'}
      `}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {isLatest && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-white/10 rounded-bl-xl">
           <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">LATEST</span>
        </div>
      )}
      <div className="flex flex-col overflow-hidden max-w-[50%]">
        <p className={`text-[15px] font-black tracking-tight truncate uppercase ${isLatest ? 'text-white' : 'text-zinc-900'}`}>
          {guess.guessName}
        </p>
        <div className="flex items-center gap-1.5">
          <span className={`text-[12px] font-black ${isLatest ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {getDirectionArrow(guess.direction)}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isLatest ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {guess.direction}
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className={`text-2xl font-black tracking-tighter tabular-nums ${isLatest ? 'text-white' : 'text-zinc-900'}`}>
          {guess.distance.toLocaleString()} <span className="text-[10px] font-bold uppercase">km</span>
        </p>
        <div className="flex items-center justify-end gap-1">
          <div className="w-16 h-1.5 bg-zinc-200/20 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isLatest ? 'bg-emerald-400' : 'bg-zinc-300'}`}
              style={{ width: `${guess.percentage}%` }}
            />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isLatest ? 'text-zinc-500' : 'text-zinc-300'}`}>
            {Math.round(guess.percentage)}%
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-3 animate-fade-in px-4">
      {latestGuess && renderGuessCard(latestGuess, true, 0)}
      {sortedOthers.map((guess, idx) => renderGuessCard(guess, false, idx + 1))}
    </div>
  );
};

export default GeodleBoard;
