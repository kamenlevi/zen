
import React from 'react';
import { Difficulty } from '../types.ts';
import { DIFFICULTIES } from '../constants.ts';

interface DifficultySelectorProps {
  onSelectDifficulty: (difficulty: Difficulty) => void;
  gameType?: 'sudoku' | 'wordle' | 'colordle' | null;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ onSelectDifficulty }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 w-full max-w-xs">
      {DIFFICULTIES.map((level) => (
        <button
          key={level}
          onClick={() => onSelectDifficulty(level)}
          className="w-full py-5 text-[11px] tracking-[0.2em] text-zinc-600 bg-zinc-100 rounded-3xl hover:text-zinc-900 hover:bg-zinc-200 active:bg-zinc-900 active:text-white transition-all font-bold uppercase active:scale-[0.98]"
        >
          {level}
        </button>
      ))}
    </div>
  );
};

export default DifficultySelector;
