
import React from 'react';
import { WordleStatus } from '../types.ts';

interface MiniWordleBoardProps {
  results: WordleStatus[][];
  wordLength: number;
}

const MiniWordleBoard: React.FC<MiniWordleBoardProps> = ({ results, wordLength }) => {
  const rows = Array.from({ length: 6 });

  return (
    <div className="aspect-square w-full bg-white p-2.5 flex flex-col gap-1.5 rounded-2xl border border-zinc-100 shadow-inner">
      {rows.map((_, i) => (
        <div key={i} className="flex gap-1.5 justify-center flex-1">
          {Array.from({ length: wordLength }).map((_, j) => {
            const status = results[i]?.[j] || 'tbd';
            let bgColor = 'bg-zinc-100';
            if (status === 'correct') bgColor = 'bg-emerald-600';
            else if (status === 'present') bgColor = 'bg-amber-500';
            else if (status === 'absent') bgColor = 'bg-zinc-400';
            
            return <div key={j} className={`flex-1 rounded-md ${bgColor} transition-colors duration-500`} />;
          })}
        </div>
      ))}
    </div>
  );
};

export default MiniWordleBoard;
