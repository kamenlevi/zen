
export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
  Expert = 'Expert',
  Master = 'Master',
}

export type Grid = number[][];

export interface Cell {
  value: number;
  readonly: boolean;
  isError?: boolean;
}

export type BoardState = Cell[][];

// --- Moves ---
export type CellMove = {
  type: 'cell';
  row: number;
  col: number;
  value: number;
  timestamp: number;
};

export type WordleStatus = 'absent' | 'present' | 'correct' | 'tbd';

export type WordleMove = {
  type: 'wordle-guess';
  word: string;
  timestamp: number;
};

export type ColordleMove = {
  type: 'color-guess';
  guessName: string;
  guessHex: string;
  percentage: number;
  timestamp: number;
};

export type GeodleMove = {
  type: 'geo-guess';
  guessName: string;
  distance: number;
  direction: string;
  percentage: number;
  timestamp: number;
  lat?: number;
  lng?: number;
};

export type Move = CellMove | WordleMove | ColordleMove | GeodleMove;

// --- Persistence ---
export interface CompletedGame {
  id: string;
  gameType: 'sudoku' | 'wordle' | 'colordle' | 'geodle';
  difficulty: Difficulty;
  startTime: number;
  endTime: number;
  puzzle: Grid | string; 
  solution: Grid | string;
  moves: Move[];
  explanation?: string; // New field for Wordle definitions or general insights
}

export interface InProgressGame {
  id: string;
  gameType: 'sudoku' | 'wordle' | 'colordle' | 'geodle';
  difficulty: Difficulty;
  startTime: number;
  puzzle: Grid | string;
  solution: Grid | string;
  boardState: BoardState | string[] | ColordleMove[] | GeodleMove[];
  elapsedTime: number;
  moves: Move[];
}

// --- Stats ---
export interface WordleStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>;
}

export interface SudokuStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTimes: Record<Difficulty, number | null>;
  totalSolveTime: number;
}

export interface ColordleStats {
  gamesPlayed: number;
  gamesWon: number;
  bestMatch: number;
}

export interface GeodleStats {
  gamesPlayed: number;
  gamesWon: number;
  bestDistance: number;
}

// --- Settings ---
export interface GameSettings {
  sudoku: {
    highlightRelated: boolean;
    highlightSameValue: boolean;
    errorFeedback: 'immediate' | 'manual';
  };
  wordle: {
    hardMode: boolean;
    highContrast: boolean;
  };
  colordle: {
    allowHints: boolean;
    vibrationFeedback: boolean;
  };
  geodle: {
    metricUnits: boolean;
    showCoordinates: boolean;
  };
  global: {
    animations: boolean;
    sounds: boolean;
  };
}
