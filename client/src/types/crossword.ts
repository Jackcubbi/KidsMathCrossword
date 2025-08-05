export interface GridCell {
  value: string;
  editable: boolean;
}

export interface CrosswordContent {
  grid: GridCell[][];
  answers: string[][];
}

export interface CrosswordData {
  id: string;
  title: string;
  content: CrosswordContent;
  gridSize: number;
  numberRange: {
    min: number;
    max: number;
  };
  operations: string[];
  createdAt: string;
}

export interface UserStats {
  puzzlesSolved: number;
  bestScore: number;
  bestTime: number;
  totalPoints: number;
}

export interface CrosswordHistory {
  id: string;
  userId: string;
  crosswordId: string;
  timeSpent: number;
  score: number;
  completedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  defaultGridSize: number;
  numberRange: {
    min: number;
    max: number;
  };
  operations: string[];
  createdAt: string;
  updatedAt: string;
}
