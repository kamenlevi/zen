
import React, { useState, useEffect, useMemo } from 'react';
import { CompletedGame, InProgressGame, Difficulty, WordleMove } from '../types.ts';
import MiniBoard from './MiniBoard.tsx';
import MiniWordleBoard from './MiniWordleBoard.tsx';
import MiniColordleBoard from './MiniColordleBoard.tsx';
import MiniGeodleBoard from './MiniGeodleBoard.tsx';
import { getWordFeedback } from '../services/wordleService.ts';

interface HistoryScreenProps {
  category: 'sudoku' | 'wordle' | 'colordle' | 'geodle';
  setCategory: (c: 'sudoku' | 'wordle' | 'colordle' | 'geodle') => void;
  onBack: () => void;
  onOpenStats: (game: CompletedGame | InProgressGame) => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ 
  category, setCategory, onBack, onOpenStats 
}) => {
  const [completed, setCompleted] = useState<CompletedGame[]>([]);
  const [inProgress, setInProgress] = useState<InProgressGame[]>([]);

  useEffect(() => {
    try {
      setCompleted(JSON.parse(localStorage.getItem(`zen_${category}_history`) || '[]'));
      setInProgress(JSON.parse(localStorage.getItem(`zen_${category}_progress`) || '[]'));
    } catch (e) {}
  }, [category]);

  const sortedCompleted = useMemo(() => [...completed].sort((a, b) => b.endTime - a.endTime), [completed]);

  const renderCard = (game: CompletedGame | InProgressGame, isComplete: boolean) => {
    const isSudoku = game.gameType === 'sudoku';
    const isWordle = game.gameType === 'wordle';
    const isColordle = game.gameType === 'colordle';
    const isGeodle = game.gameType === 'geodle';
    const moves = game.moves || [];
    
    // Check for "FAILED" status in Wordle
    const isFailed = isComplete && isWordle && moves.length >= 6 && (moves[moves.length - 1] as WordleMove).word !== game.solution;
    
    return (
      <div 
        key={game.id} 
        onClick={() => onOpenStats(game)}
        className="group flex flex-col p-3 bg-zinc-50 border border-zinc-100 rounded-[2rem] transition-all hover:scale-[1.03] cursor-pointer shadow-sm active:scale-95 bg-white"
      >
        <div className="aspect-square w-full mb-3 overflow-hidden rounded-2xl shadow-sm bg-zinc-50 border border-zinc-100">
          {isSudoku ? (
            <MiniBoard board={isComplete ? (game as CompletedGame).solution as any : (game as InProgressGame).boardState as any} />
          ) : isWordle ? (
            <MiniWordleBoard 
              results={moves.map(m => getWordFeedback((m as any).word, (game as any).solution as string))} 
              wordLength={5} 
            />
          ) : isColordle ? (
            <MiniColordleBoard 
              guesses={moves as any} 
              targetColor={(game as any).solution as string} 
              hideTarget={!isComplete}
            />
          ) : (
            <MiniGeodleBoard 
              guesses={moves as any} 
              isFailed={isFailed}
            />
          )}
        </div>
        <div className="px-1 space-y-0.5">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-900 leading-tight">{game.difficulty}</p>
            {!isComplete ? (
               <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1"></div>
            ) : isFailed ? (
               <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1"></div>
            ) : (
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></div>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter truncate">
              {new Date(game.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </p>
            <span className={`text-[8px] font-black uppercase tracking-widest ${!isComplete ? 'text-amber-500' : isFailed ? 'text-red-500' : 'text-emerald-500'}`}>
               {!isComplete ? 'In Progress' : isFailed ? 'Failed' : 'Solved'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-8 font-sans max-w-xl mx-auto bg-white">
      <header className="py-6 flex-shrink-0 border-b border-zinc-50 mb-6">
        <h1 className="text-5xl font-black tracking-tighter text-zinc-900 leading-none">History</h1>
        <div className="flex bg-zinc-100 p-1 rounded-full mt-6">
          {(['sudoku', 'wordle', 'colordle', 'geodle'] as const).map(t => (
            <button 
              key={t} onClick={() => setCategory(t)}
              className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${category === t ? 'bg-white text-black shadow-sm' : 'text-zinc-400'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-grow overflow-y-auto no-scrollbar space-y-10 pb-20 px-1">
        {inProgress.length > 0 && (
          <div>
            <h3 className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-4">In Progress</h3>
            <div className="grid grid-cols-2 gap-4">{inProgress.map(g => renderCard(g, false))}</div>
          </div>
        )}
        {sortedCompleted.length > 0 && (
          <div>
            <h3 className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-4">Completed</h3>
            <div className="grid grid-cols-2 gap-4">{sortedCompleted.map(g => renderCard(g, true))}</div>
          </div>
        )}
        {inProgress.length === 0 && sortedCompleted.length === 0 && (
          <div className="pt-20 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-200">No records found</p>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white/90 to-transparent">
        <button onClick={onBack} className="w-full max-w-xs mx-auto block bg-black text-white font-black py-6 rounded-[2rem] shadow-2xl uppercase tracking-[0.4em] text-[10px] active:scale-95 transition-all">Back to Menu</button>
      </footer>
    </div>
  );
};

export default HistoryScreen;
