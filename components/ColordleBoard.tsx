
import React, { useMemo } from 'react';
import { ColordleMove } from '../types.ts';

interface ColordleBoardProps {
  guesses: ColordleMove[];
}

const ColordleBoard: React.FC<ColordleBoardProps> = ({ guesses }) => {
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
        <div className="w-12 h-12 border-2 border-dashed border-zinc-900 rounded-full mb-4"></div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700">Name this color to start</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 animate-fade-in px-4">
      {/* Latest Guess - Always on top */}
      {latestGuess && (
        <div 
          className="flex items-center justify-between p-4 bg-zinc-900 rounded-[1.8rem] border border-zinc-800 shadow-xl animate-pop-in relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 px-3 py-1 bg-white/10 rounded-bl-xl">
             <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">LATEST</span>
          </div>
          <div className="flex items-center gap-4 overflow-hidden">
            <div 
              className="w-12 h-12 rounded-xl flex-shrink-0 shadow-inner border border-white/10"
              style={{ backgroundColor: latestGuess.guessHex }}
            ></div>
            <div className="overflow-hidden">
              <p className="text-[14px] font-black tracking-tight text-white truncate uppercase">{latestGuess.guessName}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Current Attempt</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-2xl font-black tracking-tighter text-white">{Math.round(latestGuess.percentage)}%</p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Similarity</p>
          </div>
        </div>
      )}

      {/* Sorted History */}
      {sortedOthers.map((guess, idx) => (
        <div 
          key={guess.timestamp} 
          className="flex items-center justify-between p-4 bg-zinc-50/80 rounded-[1.8rem] border border-zinc-200/60 shadow-sm animate-pop-in opacity-80"
          style={{ animationDelay: `${idx * 0.05}s` }}
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <div 
              className="w-12 h-12 rounded-xl flex-shrink-0 shadow-inner border border-zinc-200"
              style={{ backgroundColor: guess.guessHex }}
            ></div>
            <div className="overflow-hidden">
              <p className="text-[14px] font-black tracking-tight text-zinc-900 truncate uppercase">{guess.guessName}</p>
              <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter">Previous</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-2xl font-black tracking-tighter text-zinc-900">{Math.round(guess.percentage)}%</p>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Similarity</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ColordleBoard;
