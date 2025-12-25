
import React, { useState, useEffect, useRef } from 'react';
import { Grid, Move, WordleMove, ColordleMove, GeodleMove, CellMove } from '../types.ts';
import { PlayIcon, PauseIcon, ResetIcon } from './icons.tsx';
import MiniBoard from './MiniBoard.tsx';
import MiniWordleBoard from './MiniWordleBoard.tsx';
import GlobeView from './GlobeView.tsx';
import { getWordFeedback } from '../services/wordleService.ts';

interface TimelapsePlayerProps {
  gameType: 'sudoku' | 'wordle' | 'colordle' | 'geodle';
  initialState: Grid | string;
  solution: Grid | string;
  moves: Move[];
}

const TimelapsePlayer: React.FC<TimelapsePlayerProps> = ({ gameType, initialState, solution, moves }) => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const totalSteps = moves.length;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, gameType === 'sudoku' ? 350 : 900);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, totalSteps, gameType]);

  const renderState = () => {
    if (gameType === 'sudoku') {
      const currentGrid: Grid = (initialState as Grid).map(row => [...row]);
      moves.slice(0, currentStep + 1).forEach(m => {
        if (m.type === 'cell') {
          const cm = m as CellMove;
          currentGrid[cm.row][cm.col] = cm.value;
        } else if (m.type === 'reset' as any) {
           (initialState as Grid).forEach((row, ri) => row.forEach((val, ci) => {
              currentGrid[ri][ci] = val;
           }));
        }
      });
      return <MiniBoard board={currentGrid} className="w-full h-full" />;
    }

    if (gameType === 'wordle') {
      const currentGuesses = moves.slice(0, currentStep + 1).map(m => (m as WordleMove).word);
      const results = currentGuesses.map(w => getWordFeedback(w, solution as string));
      return <MiniWordleBoard results={results} wordLength={5} />;
    }

    if (gameType === 'colordle') {
      const stepGuesses = moves.slice(0, currentStep + 1) as ColordleMove[];
      const latest = stepGuesses.length > 0 ? stepGuesses[stepGuesses.length - 1] : null;
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-28 h-28 rounded-[2rem] border-4 border-white shadow-xl flex items-center justify-center overflow-hidden transition-all duration-500" style={{ backgroundColor: latest?.guessHex || '#f8fafc' }}>
            {!latest && <span className="text-zinc-200 font-black text-2xl uppercase tracking-widest">Start</span>}
          </div>
          {latest && (
            <div className="text-center animate-fade-in">
              <p className="text-[11px] font-black uppercase text-zinc-900 tracking-widest">{latest.guessName}</p>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{Math.round(latest.percentage)}% Match</p>
            </div>
          )}
        </div>
      );
    }

    if (gameType === 'geodle') {
      const stepGuesses = moves.slice(0, currentStep + 1) as GeodleMove[];
      const latest = stepGuesses.length > 0 ? stepGuesses[stepGuesses.length - 1] : null;
      return (
        <div className="flex flex-col items-center gap-4">
          <GlobeView guesses={stepGuesses} />
          {latest && (
            <div className="text-center animate-fade-in">
              <p className="text-[11px] font-black uppercase text-zinc-900 tracking-widest">{latest.guessName}</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{latest.distance}km • {latest.direction}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className={`aspect-square ${gameType === 'sudoku' ? 'w-64 sm:w-72' : 'w-48'} mb-10 flex items-center justify-center`}>
        {renderState()}
      </div>
      
      <div className="w-full bg-zinc-50 border border-zinc-100 p-4 rounded-[2rem] flex items-center justify-between gap-4 shadow-sm">
        <div className="flex gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform">
            {isPlaying ? <PauseIcon className="w-4 h-4 text-zinc-900" /> : <PlayIcon className="w-4 h-4 text-zinc-900 ml-0.5" />}
          </button>
          <button onClick={() => { setIsPlaying(false); setCurrentStep(-1); }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform">
            <ResetIcon className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
        <div className="flex-grow bg-zinc-200 h-1.5 rounded-full relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-zinc-900 transition-all duration-300" style={{ width: `${totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0}%` }}></div>
        </div>
        <span className="text-[9px] font-black tabular-nums text-zinc-400 w-10 text-right">{currentStep + 1}/{totalSteps}</span>
      </div>
    </div>
  );
};

export default TimelapsePlayer;
