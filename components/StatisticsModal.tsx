
import React, { useMemo } from 'react';
import { CompletedGame, InProgressGame, WordleMove } from '../types.ts';
import { formatTime } from '../utils/time.ts';
import { getWordFeedback } from '../services/wordleService.ts';
import MiniBoard from './MiniBoard.tsx';
import MiniWordleBoard from './MiniWordleBoard.tsx';
import MiniColordleBoard from './MiniColordleBoard.tsx';
import MiniGeodleBoard from './MiniGeodleBoard.tsx';
import TimelapsePlayer from './TimelapsePlayer.tsx';

interface StatisticsModalProps {
  game: CompletedGame | InProgressGame | null;
  onClose: () => void;
  onBringToGame?: (game: InProgressGame) => void;
}

const StatisticsModal: React.FC<StatisticsModalProps> = ({ game, onClose, onBringToGame }) => {
  const isCompleted = useMemo(() => game && 'endTime' in game, [game]);
  
  const attemptLog = useMemo(() => {
    if (!game || !game.moves) return [];
    if (game.gameType === 'wordle') return game.moves.filter(m => m.type === 'wordle-guess') as WordleMove[];
    if (game.gameType === 'colordle') return game.moves.filter(m => m.type === 'color-guess') as any[];
    if (game.gameType === 'geodle') return game.moves.filter(m => m.type === 'geo-guess') as any[];
    return [];
  }, [game]);

  if (!game) return null;

  const startTime = game.startTime;
  const elapsedTime = isCompleted 
    ? Math.floor(((game as CompletedGame).endTime - startTime) / 1000) 
    : (game as InProgressGame).elapsedTime || 0;
  
  const moves = game.moves || [];
  const targetSolution = (game.solution || "") as string;
  const explanation = isCompleted ? (game as CompletedGame).explanation : undefined;

  const renderMiniPreview = () => {
    if (!game.gameType) return null;

    switch (game.gameType) {
      case 'sudoku':
        const boardToRender = isCompleted ? (game as CompletedGame).solution : (game as InProgressGame).boardState;
        if (!boardToRender || typeof boardToRender === 'string') return <div className="w-full h-full bg-zinc-50 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase text-zinc-300">No Preview</div>;
        return <MiniBoard board={boardToRender as any} className="w-full h-full" />;
      case 'wordle':
        if (!targetSolution) return <div className="w-full h-full bg-zinc-50 rounded-2xl" />;
        return (
          <MiniWordleBoard 
            results={attemptLog.map(m => getWordFeedback((m as WordleMove).word, targetSolution))} 
            wordLength={5} 
          />
        );
      case 'colordle':
        return <MiniColordleBoard guesses={moves as any} targetColor={targetSolution} hideTarget={!isCompleted} />;
      case 'geodle':
        const lastMove = moves.length > 0 ? (moves[moves.length - 1] as any) : null;
        const isFailedGeo = isCompleted && (!lastMove || lastMove.percentage < 99.5);
        return <MiniGeodleBoard guesses={moves as any} isFailed={isFailedGeo} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 glass flex items-center justify-center z-[110] p-4 sm:p-8" onClick={onClose}>
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar p-8 sm:p-12 animate-pop-in" onClick={e => e.stopPropagation()}>
        <header className="mb-8 flex justify-between items-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{game.gameType} Report</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="flex flex-col gap-10">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 aspect-square max-w-[280px] mx-auto md:mx-0">
              {renderMiniPreview()}
            </div>
            
            <div className="w-full md:w-1/2 flex flex-col gap-4 justify-center">
              {game.gameType === 'wordle' && isCompleted && (
                <div className="bg-zinc-900 p-5 rounded-[2rem] border border-zinc-800 shadow-lg mb-2">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-1">Correct Word</p>
                  <p className="text-2xl font-black text-white tracking-widest uppercase">{targetSolution}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 p-5 rounded-[2rem] border border-zinc-100">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Time</p>
                  <p className="text-xl font-black tabular-nums">{formatTime(elapsedTime)}</p>
                </div>
                <div className="bg-zinc-50 p-5 rounded-[2rem] border border-zinc-100">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Guesses</p>
                  <p className="text-xl font-black">{attemptLog.length || (game.gameType === 'sudoku' ? moves.filter(m => m.type === 'cell').length : 0)}</p>
                </div>
              </div>

              <div className="bg-zinc-50 p-5 rounded-[2rem] border border-zinc-100">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Difficulty</p>
                <p className="text-xl font-black">{game.difficulty}</p>
              </div>

              {explanation && (
                <div className="bg-zinc-50 p-5 rounded-[2rem] border border-zinc-100">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Description</p>
                  <p className="text-[13px] font-medium text-zinc-600 leading-tight italic">"{explanation}"</p>
                </div>
              )}

              {game.notes && (
                <div className="bg-zinc-50 p-5 rounded-[2rem] border border-zinc-100">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">User Notes</p>
                  <p className="text-[13px] font-medium text-zinc-600 leading-tight italic">"{game.notes}"</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-10 border-t border-zinc-100">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-8 text-center">Solution Timelapse</h3>
            <TimelapsePlayer 
              gameType={game.gameType} 
              initialState={game.gameType === 'sudoku' ? (game.puzzle as any) : ''} 
              solution={game.solution as any} 
              moves={moves} 
            />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4">
          {!isCompleted && onBringToGame && (
            <button 
              onClick={() => onBringToGame(game as InProgressGame)} 
              className="w-full bg-emerald-600 text-white py-6 rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-xl active:scale-95 transition-all"
            >
              Resume Game
            </button>
          )}
          <button onClick={onClose} className="w-full bg-black text-white py-6 rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-xl active:scale-95 transition-all">
            Back to History
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatisticsModal;
