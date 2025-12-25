
import React, { useMemo } from 'react';
import { CompletedGame, InProgressGame, Move, WordleMove, ColordleMove, GeodleMove, Grid } from '../types.ts';
import { formatTime } from '../utils/time.ts';
import { getWordFeedback } from '../services/wordleService.ts';
import TimelapsePlayer from './TimelapsePlayer.tsx';
import MiniBoard from './MiniBoard.tsx';
import MiniWordleBoard from './MiniWordleBoard.tsx';
import MiniColordleBoard from './MiniColordleBoard.tsx';
import MiniGeodleBoard from './MiniGeodleBoard.tsx';

interface StatisticsModalProps {
  game: CompletedGame | InProgressGame | null;
  onClose: () => void;
  onBringToGame?: () => void;
}

const StatisticsModal: React.FC<StatisticsModalProps> = ({ game, onClose, onBringToGame }) => {
  const isCompleted = useMemo(() => game && 'endTime' in game, [game]);
  
  if (!game) return null;

  const startTime = game.startTime;
  const elapsedTime = isCompleted ? Math.floor(((game as CompletedGame).endTime - startTime) / 1000) : (game as InProgressGame).elapsedTime;
  const moves = game.moves || [];
  const wordleMoves = useMemo(() => moves.filter((m): m is WordleMove => m.type === 'wordle-guess'), [moves]);
  const targetSolution = (game.solution as string);
  const explanation = isCompleted ? (game as CompletedGame).explanation : undefined;

  // Status Detection
  const isFailed = isCompleted && game.gameType !== 'colordle' && game.gameType !== 'geodle' && (
    (game.gameType === 'wordle' && wordleMoves.length >= 6 && wordleMoves[wordleMoves.length - 1].word !== targetSolution)
  );
  
  const statusLabel = !isCompleted ? 'IN PROGRESS' : (isFailed ? 'FAILED' : 'SOLVED');
  const statusColor = !isCompleted ? 'text-amber-500 bg-amber-50' : (isFailed ? 'text-red-500 bg-red-50' : 'text-emerald-500 bg-emerald-50');

  const renderEndState = () => {
    if (game.gameType === 'sudoku') {
      return <MiniBoard board={isCompleted ? (game as CompletedGame).solution as any : (game as InProgressGame).boardState as any} />;
    }
    if (game.gameType === 'wordle') {
      const results = wordleMoves.map(m => getWordFeedback(m.word, targetSolution));
      return <MiniWordleBoard results={results} wordLength={5} />;
    }
    if (game.gameType === 'colordle') {
      return <MiniColordleBoard guesses={moves as any} targetColor={targetSolution} hideTarget={!isCompleted} />;
    }
    if (game.gameType === 'geodle') {
      return <MiniGeodleBoard guesses={moves as any} isFailed={isFailed} />;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 glass flex items-center justify-center z-[100] p-4 sm:p-6 font-sans overflow-hidden" onClick={onClose}>
      <div className="bg-white rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.25)] w-full max-w-lg max-h-[96vh] flex flex-col animate-pop-in border border-zinc-100" onClick={e => e.stopPropagation()}>
        
        <header className="p-8 pb-4 text-left border-b border-zinc-50 flex justify-between items-start flex-shrink-0">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">{game.gameType} Report</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
              {new Date(startTime).toLocaleDateString()} • {game.difficulty}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-200 hover:text-black p-1 transition-colors">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </header>

        <main className="px-8 py-6 flex-grow overflow-y-auto no-scrollbar">
          {/* Status Bar */}
          <div className="mb-8 flex items-center justify-between">
             <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                {statusLabel}
             </div>
             {isCompleted && game.gameType !== 'sudoku' && (
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">The Answer</span>
                  <span className="text-lg font-black text-zinc-900 tracking-widest uppercase truncate max-w-[150px]">{targetSolution}</span>
                </div>
             )}
          </div>

          {/* Explanation/Insight Section */}
          {explanation && (
            <div className="mb-8 p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 animate-fade-in">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-2">Zen Insight</p>
              <p className="text-[14px] font-medium italic text-zinc-600 leading-relaxed">
                "{explanation}"
              </p>
            </div>
          )}

          {/* Top Row: Mini Board on Left, Stats on Right */}
          <div className="flex gap-6 mb-10 items-center">
            <div className="w-36 h-36 flex-shrink-0 shadow-xl rounded-[2rem] overflow-hidden border-2 border-zinc-50 bg-white">
              {renderEndState()}
            </div>
            
            <div className="flex-grow space-y-4">
               <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                  <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Time Elapsed</p>
                  <p className="text-xl font-black text-zinc-900 tabular-nums">{formatTime(elapsedTime)}</p>
               </div>
               <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                  <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Attempts Taken</p>
                  <p className="text-xl font-black text-zinc-900">
                    {game.gameType === 'wordle' ? `${wordleMoves.length}/6` : moves.length}
                  </p>
               </div>
            </div>
          </div>

          {/* Game Timeline / Written Words */}
          <div className="mb-10">
             <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-4">Move Sequence</h3>
             <div className="grid grid-cols-1 gap-2">
                {moves.length > 0 ? (
                  moves.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between px-5 py-3 bg-zinc-50/50 border border-zinc-100 rounded-2xl">
                       <span className="text-[12px] font-black text-zinc-900 uppercase tracking-wider truncate max-w-[70%]">
                          {m.type === 'wordle-guess' ? m.word : m.type === 'color-guess' ? m.guessName : m.type === 'geo-guess' ? m.guessName : `Coordinate: [${m.row}, ${m.col}] → ${m.value}`}
                       </span>
                       <span className="text-[9px] font-black text-zinc-300 tabular-nums uppercase">
                         {m.type === 'geo-guess' ? `${Math.round(m.percentage)}%` : `#${idx + 1}`}
                       </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-zinc-300 text-[10px] font-black uppercase">Genesis State Only</p>
                )}
             </div>
          </div>

          <div className="border-t border-zinc-50 pt-10">
            <h3 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em] mb-8 text-center">Live Solution Replay</h3>
            <TimelapsePlayer 
              gameType={game.gameType} 
              initialState={game.gameType === 'sudoku' ? (game as any).puzzle as Grid : ''} 
              solution={game.solution} 
              moves={moves} 
            />
          </div>
        </main>
        
        <footer className="p-8 bg-white border-t border-zinc-50 pt-6 flex-shrink-0">
          <button onClick={onBringToGame} className="w-full bg-black text-white font-black py-6 rounded-[2rem] shadow-2xl active:scale-95 transition-all uppercase text-[10px] tracking-[0.4em]">
            {isCompleted ? 'Exit to Hub' : 'Resume Journey'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default StatisticsModal;
