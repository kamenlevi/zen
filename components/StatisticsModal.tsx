
import React, { useMemo } from 'react';
import { CompletedGame, InProgressGame, WordleMove } from '../types.ts';
import { formatTime } from '../utils/time.ts';
import { getWordFeedback } from '../services/wordleService.ts';
import MiniBoard from './MiniBoard.tsx';
import MiniWordleBoard from './MiniWordleBoard.tsx';

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
  const wordleMoves = moves.filter((m): m is WordleMove => m.type === 'wordle-guess');
  const targetSolution = game.solution as string;
  const explanation = isCompleted ? (game as CompletedGame).explanation : undefined;

  return (
    <div className="fixed inset-0 glass flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-8 animate-pop-in" onClick={e => e.stopPropagation()}>
        <header className="mb-8 flex justify-between">
          <h2 className="text-3xl font-black uppercase">{game.gameType} Report</h2>
          <button onClick={onClose} className="text-zinc-300">Close</button>
        </header>

        <div className="space-y-6">
          <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
             <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Status</p>
             <p className="text-xl font-black uppercase">{isCompleted ? 'Completed' : 'In Progress'}</p>
          </div>

          {explanation && (
            <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100 italic text-zinc-600">
              <p className="text-[10px] font-black text-zinc-400 uppercase not-italic mb-2">Definition</p>
              "{explanation}"
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
               <p className="text-[10px] font-black text-zinc-400 uppercase">Time</p>
               <p className="text-2xl font-black">{formatTime(elapsedTime)}</p>
            </div>
            <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
               <p className="text-[10px] font-black text-zinc-400 uppercase">Attempts</p>
               <p className="text-2xl font-black">{moves.length}</p>
            </div>
          </div>
        </div>

        <button onClick={onBringToGame} className="w-full bg-black text-white py-6 rounded-[2rem] mt-8 font-black uppercase text-[10px] tracking-widest">
          {isCompleted ? 'Exit' : 'Resume'}
        </button>
      </div>
    </div>
  );
};

export default StatisticsModal;
