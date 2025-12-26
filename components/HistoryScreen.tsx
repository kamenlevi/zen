
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
  historyClickResumes: boolean;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ 
  category, setCategory, onBack, onOpenStats, onContinueGame
}) => {
  const [completed, setCompleted] = useState<CompletedGame[]>([]);
  const [inProgress, setInProgress] = useState<InProgressGame[]>([]);

  useEffect(() => {
    try {
      setCompleted(JSON.parse(localStorage.getItem(`zen_${category}_history`) || '[]'));
      setInProgress(JSON.parse(localStorage.getItem(`zen_${category}_in_progress_list`) || '[]'));
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
        onPointerDown={() => {
          if (isComplete) {
            onOpenStats(game); // Always show stats for completed games
          } else { // In-progress game
            if (historyClickResumes) {
              onContinueGame(game as InProgressGame); // Resume if setting is true
            } else {
              onOpenStats(game); // Show stats if setting is false
            }
          }
        }}
        className={`group w-full flex flex-col p-6 sm:p-8 bg-white border border-zinc-100 rounded-2xl sm:rounded-3xl transition-all hover:scale-[1.03] active:scale-[0.98] shadow-lg text-left relative overflow-hidden outline-none ${isColordle ? 'bg-zinc-50/20 ring-1 ring-zinc-50' : ''}`}
      >
        <div className="aspect-square w-full mb-8 sm:mb-10 overflow-hidden rounded-xl sm:rounded-2xl shadow-inner bg-white border border-zinc-100 relative pointer-events-none">
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
        
        <div className="px-2 w-full flex flex-col gap-3 sm:gap-4 pointer-events-none">
          <div className="flex justify-between items-center">
            <h4 className="text-xl sm:text-2xl font-black uppercase text-zinc-900 leading-none truncate flex-grow mr-2">
               {mainLabel}
            </h4>
            {!isComplete && <div className="w-4 h-4 rounded-full bg-amber-400 animate-pulse flex-shrink-0"></div>}
          </div>
          
          <div className="flex justify-between items-center opacity-70">
            <p className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-tighter">
               {isComplete ? game.difficulty : 'ACTIVE JOURNEY'}
            </p>
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-900">
              {isComplete ? 'View' : 'Resume'}
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col p-5 sm:p-12 font-sans max-w-xl mx-auto bg-white">
      <header className="py-3 flex-shrink-0 border-b border-zinc-50 mb-10 sm:mb-20">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-zinc-900 leading-none uppercase mb-6">History</h1>
        
        <div className="grid grid-cols-4 bg-zinc-50 border border-zinc-100 p-1.5 rounded-3xl w-full shadow-inner gap-2 sm:gap-4">
          {(['sudoku', 'wordle', 'colordle', 'geodle'] as const).map(t => (
            <button 
              key={t} onPointerDown={() => setCategory(t)}
              className={`py-3 sm:py-6 text-[10px] sm:text-[12px] font-black uppercase tracking-widest rounded-2xl transition-all ${category === t ? 'bg-zinc-900 text-white shadow-lg scale-[1.03]' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-grow overflow-y-auto no-scrollbar space-y-24 sm:space-y-48 pb-72">
        {inProgress.length > 0 && (
          <div>
            <h3 className="text-[11px] sm:text-[13px] font-black text-zinc-300 uppercase tracking-[0.6em] mb-10 sm:mb-20 px-6">Active Sprints</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16">{inProgress.map(g => renderCard(g, false))}</div>
          </div>
        )}
        {sortedCompleted.length > 0 && (
          <div>
            <h3 className="text-[11px] sm:text-[13px] font-black text-zinc-300 uppercase tracking-[0.6em] mb-10 sm:mb-20 px-6">Mastered Games</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16">{sortedCompleted.map(g => renderCard(g, true))}</div>
          </div>
        )}
        {inProgress.length === 0 && sortedCompleted.length === 0 && (
          <div className="pt-40 text-center">
            <p className="text-[18px] font-bold uppercase tracking-widest text-zinc-200">History is empty</p>
          </div>
        )}
      </main>

      <footer className="mt-12 text-center">
        <button onPointerDown={onBack} className="w-full max-w-xs mx-auto bg-black text-white font-black py-5 rounded-full shadow-lg uppercase tracking-[0.5em] text-[11px] active:scale-95 transition-all">Home Page</button>
      </footer>
    </div>
  );
};

export default HistoryScreen;
