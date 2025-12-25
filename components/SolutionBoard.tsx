import React from 'react';
import { Grid } from '../types';

interface SolutionBoardProps {
  solution: Grid;
}

const SolutionBoard: React.FC<SolutionBoardProps> = ({ solution }) => {
  return (
    <div className="w-full aspect-square bg-gray-50 grid grid-cols-9 grid-rows-9 border-2 border-gray-400 rounded-sm">
      {solution.map((row, rowIndex) =>
        row.map((cellValue, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`
              border border-gray-200
              ${(colIndex + 1) % 3 === 0 && colIndex < 8 ? 'border-r-2 border-r-gray-400' : ''}
              ${(rowIndex + 1) % 3 === 0 && rowIndex < 8 ? 'border-b-2 border-b-gray-400' : ''}
              flex items-center justify-center text-2xl text-blue-600 font-semibold
            `}
          >
            {cellValue}
          </div>
        ))
      )}
    </div>
  );
};

export default SolutionBoard;
