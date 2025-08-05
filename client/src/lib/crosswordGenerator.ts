import type { CrosswordContent } from "@/types/crossword";

interface NumberRange {
  min: number;
  max: number;
}

interface GridCell {
  value: string;
  editable: boolean;
}

export function generateCrossword(
  gridSize: number,
  numberRange: NumberRange,
  operations: string[]
): CrosswordContent {
  const grid: GridCell[][] = [];
  const answers: string[][] = [];

  // Initialize grid and answers
  for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    answers[i] = [];
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = { value: '', editable: false };
      answers[i][j] = '';
    }
  }

  // Generate random number within range
  const getRandomNumber = () => {
    return Math.floor(Math.random() * (numberRange.max - numberRange.min + 1)) + numberRange.min;
  };

  // Get random operation
  const getRandomOperation = () => {
    return operations[Math.floor(Math.random() * operations.length)];
  };

  // Calculate result based on operation
  const calculateResult = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return Math.max(0, a - b); // Avoid negative results
      case '×':
        return a * b;
      case '÷':
        return b !== 0 ? Math.floor(a / b) : a; // Avoid division by zero
      default:
        return a + b;
    }
  };

  // Simple 7x7 pattern for demonstration
  if (gridSize === 7) {
    // Row equations
    for (let row = 0; row < gridSize; row += 2) {
      if (row < gridSize) {
        const a = getRandomNumber();
        const b = getRandomNumber();
        const op = getRandomOperation();
        const result = calculateResult(a, b, op);

        // Place equation: a op b = result
        if (row < gridSize) {
          grid[row][0] = { value: a.toString(), editable: false };
          grid[row][1] = { value: '', editable: true };
          answers[row][1] = op;
          
          grid[row][2] = { value: b.toString(), editable: false };
          grid[row][3] = { value: '=', editable: false };
          grid[row][4] = { value: '', editable: true };
          answers[row][4] = result.toString();
        }
      }
    }

    // Column equations
    for (let col = 0; col < gridSize; col += 2) {
      if (col < gridSize) {
        const a = getRandomNumber();
        const b = getRandomNumber();
        const op = getRandomOperation();
        const result = calculateResult(a, b, op);

        // Place vertical equation
        if (col < gridSize) {
          grid[0][col] = { value: a.toString(), editable: false };
          grid[1][col] = { value: '', editable: true };
          answers[1][col] = op;
          
          grid[2][col] = { value: b.toString(), editable: false };
          grid[3][col] = { value: '=', editable: false };
          grid[4][col] = { value: '', editable: true };
          answers[4][col] = result.toString();
        }
      }
    }

    // Fill equals signs for intersection
    grid[3][3] = { value: '=', editable: false };
  } else {
    // Simplified pattern for other grid sizes
    const step = Math.floor(gridSize / 3);
    
    for (let i = 0; i < gridSize; i += step) {
      for (let j = 0; j < gridSize - 4; j += step) {
        if (i < gridSize && j + 4 < gridSize) {
          const a = getRandomNumber();
          const b = getRandomNumber();
          const op = getRandomOperation();
          const result = calculateResult(a, b, op);

          grid[i][j] = { value: a.toString(), editable: false };
          grid[i][j + 1] = { value: '', editable: true };
          answers[i][j + 1] = op;
          
          grid[i][j + 2] = { value: b.toString(), editable: false };
          grid[i][j + 3] = { value: '=', editable: false };
          grid[i][j + 4] = { value: '', editable: true };
          answers[i][j + 4] = result.toString();
        }
      }
    }
  }

  // Fill empty cells
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (grid[i][j].value === '' && !grid[i][j].editable) {
        // Fill with random number or operation for visual appeal
        if (Math.random() > 0.7) {
          grid[i][j] = { value: getRandomNumber().toString(), editable: false };
        }
      }
    }
  }

  return {
    grid,
    answers,
  };
}
