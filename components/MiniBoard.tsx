
import React from 'react';
import { Grid, BoardState, Cell } from '../types.ts';

interface MiniBoardProps {
  board: Grid | BoardState;
  className?: string;
}

const isBoardState = (board: Grid | BoardState): board is BoardState => {
  return typeof board[0][0] === 'object' && board[0][0] !== null;
};

const MiniBoard: React.FC<MiniBoardProps> = ({ board, className = '' }) => {
  const isState = isBoardState(board);

  return (
    <div className={`aspect-square bg-zinc-200 grid grid-cols-9 grid-rows-9 border border-zinc-300 rounded-lg overflow-hidden ${className}`}>
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const cellValue = isState ? (cell as Cell).value : (cell as number);
          const isReadonly = isState ? (cell as Cell).readonly : true;
          
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                border-r border-b border-zinc-200 bg-white
                ${(colIndex + 1) % 3 === 0 && colIndex < 8 ? 'border-r-zinc-300' : ''}
                ${(rowIndex + 1) % 3 === 0 && rowIndex < 8 ? 'border-b-zinc-300' : ''}
                flex items-center justify-center
              `}
            >
              <span className={`text-[10px] sm:text-xs font-black ${
                isReadonly ? 'text-zinc-800' : 'text-blue-500 italic'
              }`}>
                  {cellValue !== 0 ? cellValue : ''}
              </span>
            </div>
          )
        })
      )}
    </div>
  );
};

export default MiniBoard;
