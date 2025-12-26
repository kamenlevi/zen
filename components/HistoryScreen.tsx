
import React, { useState, useEffect, useMemo } from 'react';
import { CompletedGame, InProgressGame, WordleMove } from '../types.ts';
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
  onContinueGame: (game: InProgressGame) => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ 
  category, setCategory, onBack, onOpenStats, onContinueGame
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
    const moves = game.moves || [];
    const solution = (game.solution || "") as string;
    
    let mainLabel = game.difficulty as string;
    if (isComplete && !isSudoku) {
        mainLabel = solution;
    }

    return (
      <button 
        key={game.id} 
        onClick={() => isComplete ? onOpenStats(game) : onContinueGame(game as InProgressGame)}
        className={`group w-full flex flex-col p-6 sm:p-8 bg-white border border-zinc-100 rounded-[2.5rem] sm:rounded-[3.5rem] transition-all hover:scale-[1.03] active:scale-[0.98] shadow-xl text-left relative overflow-hidden outline-none ${isColordle ? 'bg-zinc-50/20 ring-1 ring-zinc-50' : ''}`}
      >
        <div className="aspect-square w-full mb-6 sm:mb-8 overflow-hidden rounded-[2rem] sm:rounded-[2.8rem] shadow-inner bg-white border border-zinc-100 relative pointer-events-none">
          {isSudoku ? (
            <MiniBoard board={isComplete ? (game as CompletedGame).solution as any : (game as InProgressGame).boardState as any} />
          ) : isWordle ? (
            <MiniWordleBoard 
              results={moves.filter(m => m.type === 'wordle-guess').map(m => getWordFeedback((m as any).word, solution))} 
              wordLength={5} 
            />
          ) : isColordle ? (
            <MiniColordleBoard guesses={moves as any} targetColor={solution} hideTarget={!isComplete} />
          ) : (
            <MiniGeodleBoard guesses={moves as any} isFailed={isComplete && !moves.some(m => (m as any).percentage >= 99.5)} />
          )}
        </div>
        
        <div className="px-1 w-full flex flex-col gap-2 sm:gap-3 pointer-events-none">
          <div className="flex justify-between items-center">
            <h4 className="text-[15px] sm:text-[17px] font-black uppercase text-zinc-900 leading-none truncate flex-grow mr-2">
               {mainLabel}
            </h4>
            {!isComplete && <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse flex-shrink-0"></div>}
          </div>
          
          <div className="flex justify-between items-center opacity-70">
            <p className="text-[9px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">
               {isComplete ? game.difficulty : 'ACTIVE JOURNEY'}
            </p>
            <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-900">
              {isComplete ? 'View' : 'Resume'}
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col p-6 sm:p-10 font-sans max-w-xl mx-auto bg-white">
      <header className="py-4 sm:py-8 flex-shrink-0 border-b border-zinc-50 mb-8 sm:mb-12">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-zinc-900 leading-none uppercase">History</h1>
        
        <div className="grid grid-cols-4 bg-zinc-50 border border-zinc-100 p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl mt-6 sm:mt-12 w-full shadow-inner gap-3 sm:gap-4">
          {(['sudoku', 'wordle', 'colordle', 'geodle'] as const).map(t => (
            <button 
              key={t} onClick={() => setCategory(t)}
              className={`py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl sm:rounded-2xl transition-all ${category === t ? 'bg-zinc-900 text-white shadow-xl scale-[1.05]' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-grow overflow-y-auto no-scrollbar space-y-20 sm:space-y-32 pb-64">
        {inProgress.length > 0 && (
          <div>
            <h3 className="text-[10px] sm:text-[12px] font-black text-zinc-300 uppercase tracking-[0.5em] mb-12 sm:mb-16 px-4">Active Sprints</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 sm:gap-24">{inProgress.map(g => renderCard(g, false))}</div>
          </div>
        )}
        {sortedCompleted.length > 0 && (
          <div>
            <h3 className="text-[10px] sm:text-[12px] font-black text-zinc-300 uppercase tracking-[0.5em] mb-12 sm:mb-16 px-4">Mastered Games</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 sm:gap-24">{sortedCompleted.map(g => renderCard(g, true))}</div>
          </div>
        )}
        {inProgress.length === 0 && sortedCompleted.length === 0 && (
          <div className="pt-32 text-center">
            <p className="text-[15px] font-bold uppercase tracking-widest text-zinc-200">History is currently empty</p>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-8 sm:p-12 bg-gradient-to-t from-white via-white/95 to-transparent pt-24 pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto w-full max-w-xs mx-auto block bg-black text-white font-black py-6 sm:py-8 rounded-full shadow-2xl uppercase tracking-[0.4em] text-[10px] sm:text-[12px] active:scale-95 transition-all">Home Page</button>
      </footer>
    </div>
  );
};

export default HistoryScreen;
