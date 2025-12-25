
import { Difficulty, Grid } from '../types.ts';

const isValid = (board: Grid, row: number, col: number, num: number): boolean => {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
  }
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }
  return true;
};

const solve = (board: Grid): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solve(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const fillDiagonal = (board: Grid) => {
  for (let i = 0; i < 9; i += 3) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        let num;
        do {
          num = Math.floor(Math.random() * 9) + 1;
        } while (!isValid(board, i + r, i + c, num));
        board[i + r][i + c] = num;
      }
    }
  }
};

export function generateSudoku(difficulty: Difficulty): { puzzle: Grid, solution: Grid } {
  const board: Grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillDiagonal(board);
  solve(board);
  
  const solution = board.map(row => [...row]);
  const puzzle = board.map(row => [...row]);

  let cluesToRemove: number;
  switch (difficulty) {
    case Difficulty.Easy: cluesToRemove = 35; break;
    case Difficulty.Medium: cluesToRemove = 45; break;
    case Difficulty.Hard: cluesToRemove = 52; break;
    case Difficulty.Expert: cluesToRemove = 58; break;
    case Difficulty.Master: cluesToRemove = 64; break;
    default: cluesToRemove = 45;
  }

  let count = 0;
  while (count < cluesToRemove) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      count++;
    }
  }

  return { puzzle, solution };
}
