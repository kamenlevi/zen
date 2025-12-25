import React from 'react';
import { BoardState } from '../types.ts';

interface BoardProps {
  boardState: BoardState;
  selectedCell: { row: number; col: number } | null;
  onCellSelect: (row: number, col: number) => void;
  highlightedValue: number | null;
}

const Board: React.FC<BoardProps> = ({ boardState, selectedCell, onCellSelect, highlightedValue }) => {
  const isRelated = (r: number, c: number) => {
    if (!selectedCell) return false;
    const { row, col } = selectedCell;
    const sameBox = Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3);
    return r === row || c === col || sameBox;
  };

  return (
    <div className="flex items-center justify-center w-full px-2">
      <div className="w-full max-w-[min(94vw,420px,55vh)] aspect-square bg-zinc-900 grid grid-cols-9 grid-rows-9 p-[1px] rounded-xl shadow-2xl border-[1.5px] border-zinc-900 overflow-hidden">
        {boardState.map((row, ri) => 
          row.map((cell, ci) => {
            const isSelected = selectedCell?.row === ri && selectedCell?.col === ci;
            const related = isRelated(ri, ci);
            const sameValue = highlightedValue !== 0 && cell.value !== 0 && cell.value === highlightedValue;
            
            const hasThickRight = (ci + 1) % 3 === 0 && ci < 8;
            const hasThickBottom = (ri + 1) % 3 === 0 && ri < 8;

            return (
              <div
                key={`${ri}-${ci}`}
                onClick={() => onCellSelect(ri, ci)}
                className={`
                  relative flex items-center justify-center cursor-pointer select-none transition-all duration-75
                  ${hasThickRight ? 'border-r-[1.5px] border-r-zinc-900' : 'border-r-[0.5px] border-r-zinc-100'}
                  ${hasThickBottom ? 'border-b-[1.5px] border-b-zinc-900' : 'border-b-[0.5px] border-b-zinc-100'}
                  ${ci === 8 ? 'border-r-0' : ''}
                  ${ri === 8 ? 'border-b-0' : ''}
                  ${isSelected ? 'bg-zinc-800 z-10 scale-[1.03] shadow-lg' : sameValue ? 'bg-zinc-200' : related ? 'bg-zinc-50' : 'bg-white'}
                  h-full w-full
                `}
              >
                <span className={`
                  text-base sm:text-2xl font-black tabular-nums
                  ${isSelected ? 'text-white' : cell.isError ? 'text-red-500 animate-shake' : cell.readonly ? 'text-zinc-900' : 'text-blue-600 font-bold'}
                `}>
                  {cell.value !== 0 ? cell.value : ''}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Board;