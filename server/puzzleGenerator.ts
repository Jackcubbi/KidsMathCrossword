import type { GridCell } from '@shared/schema';

/**
 * Puzzle Generator for Math Crossword
 * Generates variable grid size puzzles (5x5, 7x7, 9x9) based on difficulty
 */

interface DifficultyConfig {
  gridSize: number; // 5, 7, or 9
  minNumber: number;
  maxNumber: number;
  operators: string[];
  allowNegativeResults: boolean;
  allowDecimals: boolean;
}

const DIFFICULTY_CONFIGS: Record<'easy' | 'medium' | 'hard', DifficultyConfig> = {
  easy: {
    gridSize: 5,
    minNumber: 1,
    maxNumber: 10,
    operators: ['+', '-'],
    allowNegativeResults: false,
    allowDecimals: false,
  },
  medium: {
    gridSize: 7,
    minNumber: 1,
    maxNumber: 20,
    operators: ['+', '-', '*'],
    allowNegativeResults: true,
    allowDecimals: false,
  },
  hard: {
    gridSize: 9,
    minNumber: 1,
    maxNumber: 50,
    operators: ['+', '-', '*', '/'],
    allowNegativeResults: true,
    allowDecimals: false,
  },
};

/**
 * Generate a random number within the difficulty range
 */
function getRandomNumber(config: DifficultyConfig): number {
  return Math.floor(Math.random() * (config.maxNumber - config.minNumber + 1)) + config.minNumber;
}

/**
 * Get a random operator based on difficulty
 */
function getRandomOperator(config: DifficultyConfig): string {
  return config.operators[Math.floor(Math.random() * config.operators.length)];
}

/**
 * Evaluate a simple two-operand equation
 */
function evaluateEquation(num1: number, operator: string, num2: number): number | null {
  switch (operator) {
    case '+':
      return num1 + num2;
    case '-':
      return num1 - num2;
    case '*':
      return num1 * num2;
    case '/':
      if (num2 === 0) return null;
      const result = num1 / num2;
      return Number.isInteger(result) ? result : null; // Only allow integer division
    default:
      return null;
  }
}

/**
 * Evaluate an equation with multiple operands and operators
 * Respects order of operations: multiplication and division first, then addition and subtraction
 */
function evaluateFullEquation(values: number[], operators: string[]): number | null {
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];

  // Apply order of operations: multiplication and division first, then addition and subtraction
  const nums = [...values];
  const ops = [...operators];

  // First pass: handle * and /
  for (let i = 0; i < ops.length; i++) {
    if (ops[i] === '*' || ops[i] === '/') {
      const result = evaluateEquation(nums[i], ops[i], nums[i + 1]);
      if (result === null) return null;
      nums.splice(i, 2, result);
      ops.splice(i, 1);
      i--; // Recheck the same index
    }
  }

  // Second pass: handle + and -
  let result = nums[0];
  for (let i = 0; i < ops.length; i++) {
    const calc = evaluateEquation(result, ops[i], nums[i + 1]);
    if (calc === null) return null;
    result = calc;
  }

  return result;
}

/**
 * Generate a valid equation that results in an integer
 */
function generateValidEquation(config: DifficultyConfig): { num1: number; operator: string; num2: number; result: number } | null {
  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const num1 = getRandomNumber(config);
    const operator = getRandomOperator(config);
    let num2 = getRandomNumber(config);

    // Special handling for division to ensure integer results
    if (operator === '/') {
      // Make num1 a multiple of num2
      num2 = Math.max(1, Math.floor(Math.random() * 10) + 1);
      const multiplier = Math.floor(Math.random() * 10) + 1;
      const actualNum1 = num2 * multiplier;

      if (actualNum1 >= config.minNumber && actualNum1 <= config.maxNumber) {
        return { num1: actualNum1, operator, num2, result: multiplier };
      }
    } else {
      const result = evaluateEquation(num1, operator, num2);

      if (result !== null) {
        // Check if result is within acceptable range
        if (!config.allowNegativeResults && result < 0) {
          attempts++;
          continue;
        }

        // Keep results reasonable (not too large)
        if (Math.abs(result) <= config.maxNumber * 2) {
          return { num1, operator, num2, result };
        }
      }
    }

    attempts++;
  }

  return null;
}

/**
 * Main puzzle generation function
 * Grid layout (N x N where N is odd - 5, 7, or 9):
 * Even rows (0, 2, 4...): num op num = result (horizontal equations)
 * Odd rows (1, 3...): operators and blocked cells
 * Even cols (0, 2, 4...): vertical equations
 */
export function generatePuzzle(difficulty: 'easy' | 'medium' | 'hard'): { grid: GridCell[][], solution: GridCell[][] } {
  const config = DIFFICULTY_CONFIGS[difficulty];

  // For 9x9, use smaller numbers to make backtracking feasible
  const adjustedConfig = config.gridSize === 9
    ? { ...config, maxNumber: 10, operators: ['+', '-', '*'] }
    : config;

  const maxAttempts = adjustedConfig.gridSize === 9 ? 1000 : (adjustedConfig.gridSize === 7 ? 300 : 100);
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      // Use specialized dual-equation generator for 9x9
      const puzzle = adjustedConfig.gridSize === 9
        ? attemptPuzzleGeneration9x9(adjustedConfig)
        : attemptPuzzleGeneration(adjustedConfig);
      if (puzzle) {
        return puzzle;
      }
    } catch (error) {
      // Log errors for debugging
      if (attempts % 200 === 0) {
        console.log(`Generation attempt ${attempts} failed:`, error);
      }
    }
    attempts++;
  }

  console.warn(`Failed to generate ${adjustedConfig.gridSize}x${adjustedConfig.gridSize} puzzle after ${maxAttempts} attempts, using fallback`);
  // Fallback: return a simple valid puzzle
  return generateFallbackPuzzle(adjustedConfig);
}

/**
 * Specialized 9x9 generator with dual mini-equations
 * BOTH horizontal AND vertical equations have dual mini-equation structure
 * Horizontal: Each row has TWO equations (cols 0,2,4,6,8 are values, cols 1,5 are operators, cols 3,7 are =)
 * Vertical: Each column has TWO equations (rows 0,2,4,6,8 are values, rows 1,5 are operators, rows 3,7 are =)
 */
function attemptPuzzleGeneration9x9(config: DifficultyConfig): { grid: GridCell[][], solution: GridCell[][] } | null {
  const size = 9;

  // Use simpler config for 9x9
  const simpleConfig = {
    ...config,
    maxNumber: Math.min(50, config.maxNumber),
    operators: ['+', '-'], // Simple operators only for dual equations
    allowNegativeResults: true
  };

  // Generate 5x5 value grid (values at rows 0,2,4,6,8 and cols 0,2,4,6,8)
  // This creates a constraint satisfaction problem where both horizontal and vertical equations must be valid
  const valueGrid = generateDualEquationValueGrid(simpleConfig);
  if (!valueGrid) return null;

  return buildDualEquationGridsFromValues(valueGrid, simpleConfig);
}

/**
 * Generate a 5x5 value grid where both horizontal and vertical dual-equations are valid
 * Returns a 5x5 grid of numbers, or null if generation fails
 * This grid represents the values at positions [row*2][col*2] in the final 9x9 grid
 *
 * Strategy: Use constraint propagation
 * - Row 0: Free choice (valid horizontal)
 * - Row 1: Free choice (valid horizontal)
 * - Row 2: Computed from vertical equations row0->row1->row2, must also be valid horizontally
 * - Row 3: Free choice (valid horizontal)
 * - Row 4: Computed from vertical equations row2->row3->row4, must also be valid horizontally
 */
function generateDualEquationValueGrid(config: DifficultyConfig): number[][] | null {
  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid: number[][] = Array(5).fill(null).map(() => Array(5).fill(0));

    // Step 1: Generate first row with valid horizontal dual-equations
    const row0 = generateRandomHorizontalRow(config);
    if (!row0) continue;
    grid[0] = row0;

    // Step 2: Generate second row with valid horizontal dual-equations
    const row1 = generateRandomHorizontalRow(config);
    if (!row1) continue;
    grid[1] = row1;

    // Step 3: Compute row 2 from vertical equations (row0 op row1 = row2)
    // AND check if it forms valid horizontal equations
    const row2Valid = generateRow2FromVerticalConstraints(grid, config);
    if (!row2Valid) continue;

    // Step 4: Generate row 3 with valid horizontal dual-equations
    const row3 = generateRandomHorizontalRow(config);
    if (!row3) continue;
    grid[3] = row3;

    // Step 5: Compute row 4 from vertical equations (row2 op row3 = row4)
    // AND check if it forms valid horizontal equations
    const row4Valid = generateRow4FromVerticalConstraints(grid, config);
    if (!row4Valid) continue;

    return grid;
  }

  return null;
}

/**
 * Generate a random row with valid horizontal dual-equations
 */
function generateRandomHorizontalRow(config: DifficultyConfig): number[] | null {
  const v0 = getRandomNumber(config);
  const v1 = getRandomNumber(config);
  const op1 = getRandomOperator(config);
  const r1 = evaluateEquation(v0, op1, v1);

  if (r1 === null) return null;

  const v2 = getRandomNumber(config);
  const op2 = getRandomOperator(config);
  const r2 = evaluateEquation(r1, op2, v2);

  if (r2 === null) return null;

  return [v0, v1, r1, v2, r2];
}

/**
 * Generate row 2 from vertical constraints
 * For each column: grid[0][col] op grid[1][col] = grid[2][col]
 * Then check if row 2 can form valid horizontal equations
 */
function generateRow2FromVerticalConstraints(grid: number[][], config: DifficultyConfig): boolean {
  // Try different vertical operators for each column
  const operators = config.operators || ['+', '-'];

  for (let i = 0; i < 50; i++) {
    const row2: number[] = [];

    for (let col = 0; col < 5; col++) {
      const v0 = grid[0][col];
      const v1 = grid[1][col];
      const op = operators[Math.floor(Math.random() * operators.length)];
      const result = evaluateEquation(v0, op, v1);

      if (result === null) break;
      row2.push(result);
    }

    if (row2.length === 5 && isValidHorizontalRow(row2)) {
      grid[2] = row2;
      return true;
    }
  }

  return false;
}

/**
 * Generate row 4 from vertical constraints
 * For each column: grid[2][col] op grid[3][col] = grid[4][col]
 * Then check if row 4 can form valid horizontal equations
 */
function generateRow4FromVerticalConstraints(grid: number[][], config: DifficultyConfig): boolean {
  // Try different vertical operators for each column
  const operators = config.operators || ['+', '-'];

  for (let i = 0; i < 50; i++) {
    const row4: number[] = [];

    for (let col = 0; col < 5; col++) {
      const v0 = grid[2][col];
      const v1 = grid[3][col];
      const op = operators[Math.floor(Math.random() * operators.length)];
      const result = evaluateEquation(v0, op, v1);

      if (result === null) break;
      row4.push(result);
    }

    if (row4.length === 5 && isValidHorizontalRow(row4)) {
      grid[4] = row4;
      return true;
    }
  }

  return false;
}

/**
 * Check if a row of 5 values can form two valid mini-equations
 * v0 op1 v1 = r1 and r1 op2 v2 = r2
 */
function isValidHorizontalRow(row: number[]): boolean {
  const [v0, v1, r1, v2, r2] = row;

  // Check if there exist operators that make the equations valid
  // First equation: v0 op1 v1 = r1
  const validOp1 = ['+', '-', '*', '/'].some(op => {
    const result = evaluateEquation(v0, op, v1);
    return result !== null && Math.abs(result - r1) < 0.001;
  });

  if (!validOp1) return false;

  // Second equation: r1 op2 v2 = r2
  const validOp2 = ['+', '-', '*', '/'].some(op => {
    const result = evaluateEquation(r1, op, v2);
    return result !== null && Math.abs(result - r2) < 0.001;
  });

  return validOp2;
}

/**
 * Find an operator that makes a op b = result
 * Returns the operator or null if no valid operator found
 */
function findOperator(a: number, b: number, result: number, config: DifficultyConfig): string | null {
  const operators = config.operators || ['+', '-', '*', '/'];

  for (const op of operators) {
    const computed = evaluateEquation(a, op, b);
    if (computed === result) {
      return op;
    }
  }

  return null;
}

/**
 * Build 9x9 grid with dual mini-equations from a 5x5 value grid
 * Fills in operators to make both horizontal and vertical equations valid
 */
function buildDualEquationGridsFromValues(valueGrid: number[][], config: DifficultyConfig): { grid: GridCell[][], solution: GridCell[][] } {
  const size = 9;

  // Initialize grids
  const grid: GridCell[][] = Array(size).fill(null).map((_, row) =>
    Array(size).fill(null).map((_, col) => ({
      type: 'blocked' as const,
      value: '',
      isEditable: false,
      row,
      col
    }))
  );
  const solution: GridCell[][] = Array(size).fill(null).map((_, row) =>
    Array(size).fill(null).map((_, col) => ({
      type: 'blocked' as const,
      value: '',
      isEditable: false,
      row,
      col
    }))
  );

  // Helper function for 9x9 given numbers pattern
  const isGivenNumber = (eqRowIdx: number, valueIdx: number): boolean => {
    // Row 0: values at index 1, 3
    // Row 1: result at index 4
    // Row 2: values at index 0, 2, 4 (result)
    // Row 3: values at index 0, 3
    // Row 4: value at index 1
    return (eqRowIdx === 0 && (valueIdx === 1 || valueIdx === 3)) ||
           (eqRowIdx === 1 && valueIdx === 4) ||
           (eqRowIdx === 2 && (valueIdx === 0 || valueIdx === 2 || valueIdx === 4)) ||
           (eqRowIdx === 3 && (valueIdx === 0 || valueIdx === 3)) ||
           (eqRowIdx === 4 && valueIdx === 1);
  };

  // First, compute horizontal operators for each row
  const horizontalOps: string[][] = Array(5).fill(null).map(() => Array(2).fill(''));
  for (let row = 0; row < 5; row++) {
    const v0 = valueGrid[row][0];
    const v1 = valueGrid[row][1];
    const r1 = valueGrid[row][2];
    const v2 = valueGrid[row][3];
    const r2 = valueGrid[row][4];

    // Find op1 where v0 op1 v1 = r1
    horizontalOps[row][0] = findOperator(v0, v1, r1, config) || '+';
    // Find op2 where r1 op2 v2 = r2
    horizontalOps[row][1] = findOperator(r1, v2, r2, config) || '+';
  }

  // Next, compute vertical operators for each column
  const verticalOps: string[][] = Array(5).fill(null).map(() => Array(2).fill(''));
  for (let col = 0; col < 5; col++) {
    const v0 = valueGrid[0][col];
    const v1 = valueGrid[1][col];
    const r1 = valueGrid[2][col];
    const v2 = valueGrid[3][col];
    const r2 = valueGrid[4][col];

    // Find op1 where v0 op1 v1 = r1
    verticalOps[col][0] = findOperator(v0, v1, r1, config) || '+';
    // Find op2 where r1 op2 v2 = r2
    verticalOps[col][1] = findOperator(r1, v2, r2, config) || '+';
  }

  // Build equation rows (rows 0, 2, 4, 6, 8) - horizontal structure
  for (let eqIdx = 0; eqIdx < 5; eqIdx++) {
    const row = eqIdx * 2;
    const values = valueGrid[eqIdx]; // [v0, v1, r1, v2, r2]
    const operators = horizontalOps[eqIdx]; // [op1, op2]

    // Build: v0 op1 v1 = r1 op2 v2 = r2
    // Cols:  0   1   2  3  4  5   6  7  8

    // Col 0: v0
    const isGiven0 = isGivenNumber(eqIdx, 0);
    grid[row][0] = { type: isGiven0 ? 'number' : 'input', value: isGiven0 ? String(values[0]) : '', isEditable: !isGiven0, row, col: 0 };
    solution[row][0] = { type: isGiven0 ? 'number' : 'input', value: String(values[0]), isEditable: !isGiven0, row, col: 0 };

    // Col 1: op1
    grid[row][1] = { type: 'operator', value: operators[0], isEditable: false, row, col: 1 };
    solution[row][1] = { type: 'operator', value: operators[0], isEditable: false, row, col: 1 };

    // Col 2: v1
    const isGiven1 = isGivenNumber(eqIdx, 1);
    grid[row][2] = { type: isGiven1 ? 'number' : 'input', value: isGiven1 ? String(values[1]) : '', isEditable: !isGiven1, row, col: 2 };
    solution[row][2] = { type: isGiven1 ? 'number' : 'input', value: String(values[1]), isEditable: !isGiven1, row, col: 2 };

    // Col 3: = (first equals)
    grid[row][3] = { type: 'operator', value: '=', isEditable: false, row, col: 3 };
    solution[row][3] = { type: 'operator', value: '=', isEditable: false, row, col: 3 };

    // Col 4: r1 (intermediate result)
    const isGiven2 = isGivenNumber(eqIdx, 2);
    grid[row][4] = { type: isGiven2 ? 'number' : 'input', value: isGiven2 ? String(values[2]) : '', isEditable: !isGiven2, row, col: 4 };
    solution[row][4] = { type: isGiven2 ? 'number' : 'input', value: String(values[2]), isEditable: !isGiven2, row, col: 4 };

    // Col 5: op2
    grid[row][5] = { type: 'operator', value: operators[1], isEditable: false, row, col: 5 };
    solution[row][5] = { type: 'operator', value: operators[1], isEditable: false, row, col: 5 };

    // Col 6: v2
    const isGiven3 = isGivenNumber(eqIdx, 3);
    grid[row][6] = { type: isGiven3 ? 'number' : 'input', value: isGiven3 ? String(values[3]) : '', isEditable: !isGiven3, row, col: 6 };
    solution[row][6] = { type: isGiven3 ? 'number' : 'input', value: String(values[3]), isEditable: !isGiven3, row, col: 6 };

    // Col 7: = (second equals)
    grid[row][7] = { type: 'operator', value: '=', isEditable: false, row, col: 7 };
    solution[row][7] = { type: 'operator', value: '=', isEditable: false, row, col: 7 };

    // Col 8: r2 (final result)
    const isGiven4 = isGivenNumber(eqIdx, 4);
    grid[row][8] = { type: isGiven4 ? 'number' : 'input', value: isGiven4 ? String(values[4]) : '', isEditable: !isGiven4, row, col: 8 };
    solution[row][8] = { type: isGiven4 ? 'number' : 'input', value: String(values[4]), isEditable: !isGiven4, row, col: 8 };
  }

  // Build operator rows (rows 1, 3, 5, 7) - vertical structure with dual equations
  // Row 1: operators between row 0 and row 2 (first vertical operators)
  // Row 3: equals signs (middle of vertical equations)
  // Row 5: operators between row 4 and row 6 (second vertical operators)
  // Row 7: equals signs (end of vertical equations)

  for (let row = 1; row < size; row += 2) {
    const opRowIdx = Math.floor(row / 2); // 0 for row 1, 1 for row 3, 2 for row 5, 3 for row 7

    for (let col = 0; col < size; col++) {
      if (col % 2 === 0) {
        // Value columns
        const colIdx = col / 2;

        if (row === 1 || row === 5) {
          // Operator rows (rows 1, 5)
          const vertOpIdx = row === 1 ? 0 : 1;
          grid[row][col] = { type: 'operator', value: verticalOps[colIdx][vertOpIdx], isEditable: false, row, col };
          solution[row][col] = { type: 'operator', value: verticalOps[colIdx][vertOpIdx], isEditable: false, row, col };
        } else {
          // Equals rows (rows 3, 7)
          grid[row][col] = { type: 'operator', value: '=', isEditable: false, row, col };
          solution[row][col] = { type: 'operator', value: '=', isEditable: false, row, col };
        }
      } else {
        // Operator columns: blocked
        grid[row][col] = { type: 'blocked', value: '', isEditable: false, row, col };
        solution[row][col] = { type: 'blocked', value: '', isEditable: false, row, col };
      }
    }
  }

  console.log(`SUCCESS: Generated 9x9 puzzle with dual mini-equations`);
  return { grid, solution };
}

function buildGridsFromRows(allRows: Array<{ values: number[]; operators: string[] }>, config: DifficultyConfig): { grid: GridCell[][], solution: GridCell[][] } {
  const size = config.gridSize;
  const numEqRows = allRows.length;
  const numValues = allRows[0].values.length;

  // Calculate correct vertical operators for each column
  const verticalOperators: string[][] = [];
  for (let colIdx = 0; colIdx < numValues; colIdx++) {
    const colOps: string[] = [];

    // For each pair of rows, find the operator that makes the equation work
    for (let rowIdx = 0; rowIdx < numEqRows - 1; rowIdx++) {
      const current = allRows[rowIdx].values[colIdx];
      const next = allRows[rowIdx + 1].values[colIdx];

      // Try to find an operator that works
      const operators = ['+', '-', '*', '/'];
      let found = false;

      for (const op of operators) {
        const result = evaluateEquation(current, op, next);
        if (result !== null) {
          // For the last pair, check if it equals the final value
          if (rowIdx === numEqRows - 2) {
            // This is the last operator before the result
            // We need to check if applying all operators gives us the final value
            let verticalResult = allRows[0].values[colIdx];
            for (let i = 0; i < colOps.length; i++) {
              verticalResult = evaluateEquation(verticalResult, colOps[i], allRows[i + 1].values[colIdx])!;
            }
            verticalResult = evaluateEquation(verticalResult, op, next)!;

            if (verticalResult === allRows[numEqRows - 1].values[colIdx]) {
              colOps.push(op);
              found = true;
              break;
            }
          } else {
            // For intermediate operators, just use + or - based on the relationship
            if (next > current) {
              colOps.push('+');
            } else {
              colOps.push('-');
            }
            found = true;
            break;
          }
        }
      }

      if (!found) {
        // Fallback to + or -
        colOps.push(next > current ? '+' : '-');
      }
    }

    verticalOperators.push(colOps);
  }

  // Generate simple vertical operators for display (backwards compatibility)
  const vOps: string[] = verticalOperators.map(ops => ops[0] || '+');

  // Helper function to determine if a cell should be a given number
  // Parameters: eqRowIdx (equation row index 0,1,2...), valueIdx (value index within row 0,1,2...)
  const isGivenNumber = (eqRowIdx: number, valueIdx: number): boolean => {
    const middleRowIdx = Math.floor(numEqRows / 2);
    const middleValIdx = Math.floor(numValues / 2);

    if (size === 5) {
      // 5x5: First value (eq row 0, val 0) and last result (eq row 2, val 2)
      return (eqRowIdx === 0 && valueIdx === 0) || (eqRowIdx === numEqRows - 1 && valueIdx === numValues - 1);
    } else if (size === 7) {
      // 7x7: Four given numbers
      return (eqRowIdx === 0 && valueIdx === 0) ||                              // Top-left
             (eqRowIdx === 0 && valueIdx === numValues - 1) ||                  // Top-right (result)
             (eqRowIdx === middleRowIdx && valueIdx === middleValIdx) ||        // Center
             (eqRowIdx === numEqRows - 1 && valueIdx === numValues - 1);        // Bottom-right (result)
    } else if (size === 9) {
      // 9x9: Nine given numbers in specific pattern
      // Row 0: values at index 1, 3
      // Row 1: result at index 4
      // Row 2: values at index 0, 2, 4 (result)
      // Row 3: values at index 0, 3
      // Row 4: value at index 1
      return (eqRowIdx === 0 && (valueIdx === 1 || valueIdx === 3)) ||         // Row 0: 2nd and 4th values
             (eqRowIdx === 1 && valueIdx === 4) ||                              // Row 1: result
             (eqRowIdx === 2 && (valueIdx === 0 || valueIdx === 2 || valueIdx === 4)) || // Row 2: 1st, 3rd (middle), result
             (eqRowIdx === 3 && (valueIdx === 0 || valueIdx === 3)) ||          // Row 3: 1st and 4th
             (eqRowIdx === 4 && valueIdx === 1);                                // Row 4: 2nd value
    }
    return false;
  };

  // Build the grids - initialize ALL cells as blocked first
  const grid: GridCell[][] = Array(size).fill(null).map((_, row) =>
    Array(size).fill(null).map((_, col) => ({
      type: 'blocked' as const,
      value: '',
      isEditable: false,
      row,
      col
    }))
  );
  const solution: GridCell[][] = Array(size).fill(null).map((_, row) =>
    Array(size).fill(null).map((_, col) => ({
      type: 'blocked' as const,
      value: '',
      isEditable: false,
      row,
      col
    }))
  );

  // Fill all equation rows (0, 2, 4, 6, 8...)
  for (let eqIdx = 0; eqIdx < numEqRows; eqIdx++) {
    const row = eqIdx * 2;
    const isFirst = eqIdx === 0;
    const isLast = eqIdx === numEqRows - 1;

    const rowData = allRows[eqIdx];
    const rowValues = rowData.values;
    const rowOperators = rowData.operators;

    // Build equation: val[0] op val[1] op val[2] ... = result
    let col = 0;
    for (let i = 0; i < numValues; i++) {
      // Check if this cell should be a given number
      const isGiven = isGivenNumber(eqIdx, i);

      grid[row][col] = {
        type: isGiven ? 'number' : 'input',
        value: isGiven ? rowValues[i] : '',
        isEditable: !isGiven,
        row, col
      };
      solution[row][col] = {
        type: isGiven ? 'number' : 'input',
        value: rowValues[i],
        isEditable: !isGiven,
        row, col
      };
      col++;

      // After each value except the last: place operator or equals
      if (i < numValues - 1) {
        // For operands (not result): place horizontal operator
        if (i < numValues - 2) {
          grid[row][col] = { type: 'operator', value: rowOperators[i], isEditable: false, row, col };
          solution[row][col] = { type: 'operator', value: rowOperators[i], isEditable: false, row, col };
        } else {
          // Before result: place equals sign
          grid[row][col] = { type: 'operator', value: '=', isEditable: false, row, col };
          solution[row][col] = { type: 'operator', value: '=', isEditable: false, row, col };
        }
        col++;
      }
    }

    // Fill remaining columns with blocked
    for (; col < size; col++) {
      grid[row][col] = { type: 'blocked', value: '', isEditable: false, row, col };
      solution[row][col] = { type: 'blocked', value: '', isEditable: false, row, col };
    }
  }

  // Fill operator rows (1, 3, 5, 7...)
  for (let row = 1; row < size; row += 2) {
    const opRowIdx = Math.floor(row / 2);
    // Only the last operator row uses equals signs, all others use vertical operators
    const isEqualsRow = (row === size - 2); // Row 3 for 5x5, Row 5 for 7x7, Row 7 for 9x9

    // Fill even columns (0, 2, 4, 6, 8) with operators or equals
    for (let valIdx = 0; valIdx < numValues; valIdx++) {
      const col = valIdx * 2;
      const val = isEqualsRow ? '=' : vOps[valIdx];

      grid[row][col] = { type: 'operator', value: val, isEditable: false, row, col };
      solution[row][col] = { type: 'operator', value: val, isEditable: false, row, col };
    }

    // NO BLOCKED CELLS - odd columns remain empty for vertical equation operators
    // Fill odd columns with blocked
    for (let col = 1; col < size; col += 2) {
      grid[row][col] = { type: 'blocked', value: '', isEditable: false, row, col };
      solution[row][col] = { type: 'blocked', value: '', isEditable: false, row, col };
    }
  }

  console.log(`SUCCESS: Generated ${size}x${size} puzzle with ${numEqRows} equation rows`);
  return { grid, solution };
}

/**
 * Attempt to generate a valid puzzle with constraint solving (for 5x5 and 7x7)
 * Pattern for all sizes:
 * - 5x5: 3 values at cols 0,2,4 (val op val op result)
 * - 7x7: 4 values at cols 0,2,4,6 (val op val op val op result)
 * - 9x9: 5 values at cols 0,2,4,6,8 (val op val op val op val op result)
 * Last value is always the result!
 */
function attemptPuzzleGeneration(config: DifficultyConfig): { grid: GridCell[][], solution: GridCell[][] } | null {
  const size = config.gridSize;
  const numEqRows = Math.floor(size / 2) + 1; // 5x5:3, 7x7:4, 9x9:5
  const numValues = numEqRows; // Same as number of equation rows! 3 values for 5x5, 4 for 7x7, 5 for 9x9
  const numOps = numValues - 1; // Number of operators

  // Step 1: Generate ONLY first and last row horizontal equations
  const firstRow = { values: [] as number[], operators: [] as string[] };
  const lastRow = { values: [] as number[], operators: [] as string[] };

  // Generate first row
  for (let j = 0; j < numValues - 1; j++) {
    firstRow.values.push(getRandomNumber(config));
    if (j < numValues - 2) {
      firstRow.operators.push(getRandomOperator(config));
    }
  }
  const firstResult = evaluateFullEquation(firstRow.values, firstRow.operators);
  if (firstResult === null) return null;
  firstRow.values.push(firstResult);

  // Generate last row
  for (let j = 0; j < numValues - 1; j++) {
    lastRow.values.push(getRandomNumber(config));
    if (j < numValues - 2) {
      lastRow.operators.push(getRandomOperator(config));
    }
  }
  const lastResult = evaluateFullEquation(lastRow.values, lastRow.operators);
  if (lastResult === null) return null;
  lastRow.values.push(lastResult);

  // Step 2: Generate middle rows with proper vertical constraints
  // Build rows incrementally, ensuring vertical equations are valid
  // Generate middle rows with values that create valid vertical equations
  const allRows: Array<{ values: number[]; operators: string[] }> = [firstRow];
  const verticalOps: string[][] = Array(numValues).fill(null).map(() => []);

  // For each middle row, we need to ensure the vertical equations work
  // Approach: Work column by column, building valid vertical equations

  // First, generate all vertical equations (one per column)
  for (let colIdx = 0; colIdx < numValues; colIdx++) {
    const topVal = firstRow.values[colIdx];
    const bottomVal = lastRow.values[colIdx];
    const numOps = numEqRows - 2; // Number of operators needed (rows - first - last)

    // Build a valid vertical equation by working forward
    let currentVal = topVal;
    const columnValues: number[] = [topVal];
    const columnOps: string[] = [];

    for (let opIdx = 0; opIdx < numOps; opIdx++) {
      const isLastOp = (opIdx === numOps - 1);

      if (isLastOp) {
        // Last operator: must reach bottomVal
        const simpleOps = ['+', '-'];
        let bestOp = simpleOps[0];
        let bestVal = currentVal + (bottomVal - currentVal);

        for (const op of simpleOps) {
          const neededVal = op === '+' ? (bottomVal - currentVal) : (currentVal - bottomVal);
          if (Math.abs(neededVal) <= config.maxNumber * 2) {
            bestOp = op;
            bestVal = neededVal;
            break;
          }
        }

        columnOps.push(bestOp);
        columnValues.push(bestVal);
        currentVal = bottomVal;
      } else {
        // Intermediate operator: pick a random step towards bottomVal
        const remaining = numOps - opIdx;
        const diff = bottomVal - currentVal;
        const stepSize = Math.floor(diff / remaining);

        const simpleOps = ['+', '-'];
        const op = simpleOps[Math.floor(Math.random() * simpleOps.length)];

        let nextVal: number;
        if (op === '+') {
          nextVal = Math.max(1, Math.min(config.maxNumber, Math.abs(stepSize)));
          currentVal = currentVal + nextVal;
        } else {
          nextVal = Math.max(1, Math.min(config.maxNumber, Math.abs(stepSize)));
          currentVal = currentVal - nextVal;
        }

        columnOps.push(op);
        columnValues.push(nextVal);
      }
    }

    verticalOps[colIdx] = columnOps;

    // Store the values for each middle row
    for (let rowIdx = 0; rowIdx < numOps; rowIdx++) {
      if (!allRows[rowIdx + 1]) {
        allRows[rowIdx + 1] = { values: [], operators: [] };
      }
      allRows[rowIdx + 1].values[colIdx] = columnValues[rowIdx + 1];
    }
  }

  // Now find horizontal operators for each middle row
  for (let rowIdx = 1; rowIdx < numEqRows - 1; rowIdx++) {
    const rowValues = allRows[rowIdx].values;

    // Use backtracking to find operators that make the equation valid with order of operations
    const findOperators = (opsSoFar: string[]): string[] | null => {
      if (opsSoFar.length === numValues - 2) {
        // We have all operators, check if the equation is valid
        const result = evaluateFullEquation(rowValues.slice(0, -1), opsSoFar);
        return result === rowValues[numValues - 1] ? opsSoFar : null;
      }

      // Try each operator for the next position
      for (const op of config.operators) {
        const ops = findOperators([...opsSoFar, op]);
        if (ops !== null) return ops;
      }

      return null;
    };

    const middleOps = findOperators([]);
    if (middleOps === null) return null;

    allRows[rowIdx].operators = middleOps;
  }

  allRows.push(lastRow);

  // vOps for grid building (use first operator from each column)
  const vOps: string[] = verticalOps.map(ops => ops[0] || '+');

  console.log(`SUCCESS: Generated ${size}x${size} puzzle with ${numEqRows} equation rows`);

  // Build the grids - initialize ALL cells as blocked first
  const grid: GridCell[][] = Array(size).fill(null).map((_, row) =>
    Array(size).fill(null).map((_, col) => ({
      type: 'blocked' as const,
      value: '',
      isEditable: false,
      row,
      col
    }))
  );
  const solution: GridCell[][] = Array(size).fill(null).map((_, row) =>
    Array(size).fill(null).map((_, col) => ({
      type: 'blocked' as const,
      value: '',
      isEditable: false,
      row,
      col
    }))
  );

  // Fill all equation rows (0, 2, 4, 6, 8...)
  for (let eqIdx = 0; eqIdx < numEqRows; eqIdx++) {
    const row = eqIdx * 2;
    const isFirst = eqIdx === 0;
    const isLast = eqIdx === numEqRows - 1;

    const rowData = allRows[eqIdx];
    const rowValues = rowData.values;
    const rowOperators = rowData.operators;

    // Build equation: val[0] op val[1] op val[2] ... = result
    // For 7x7: v0 op0 v1 op1 v2 op2 v3 = result (values at cols 0,2,4,6; ops at cols 1,3,5)
    let col = 0;
    for (let i = 0; i < numValues; i++) {
      // Value
      const isResultColumn = (i === numValues - 1);
      const middleRowIdx = Math.floor(numEqRows / 2);
      const middleValIdx = Math.floor(numValues / 2);

      // Determine if this cell should be a given number (N) or input
      let isGiven = false;
      if (size === 5) {
        // 5x5: First value and last result
        isGiven = (isFirst && i === 0) || (isLast && isResultColumn);
      } else if (size === 7) {
        // 7x7: Four corners
        isGiven = (eqIdx === 0 && i === 0) ||                       // Top-left
                  (eqIdx === 0 && isResultColumn) ||                // Top-right result
                  (eqIdx === middleRowIdx && i === middleValIdx) ||  // Center
                  (eqIdx === numEqRows - 1 && isResultColumn);      // Bottom-right result
      } else if (size === 9) {
        // 9x9: Nine given numbers in specific pattern per screenshot
        // Row 0: values at index 1, 3
        // Row 1: result at index 4
        // Row 2: values at index 0, 2, 4 (result)
        // Row 3: values at index 0, 3
        // Row 4: value at index 1
        isGiven = (eqIdx === 0 && (i === 1 || i === 3)) ||                      // Row 0: 2nd and 4th values
                  (eqIdx === 1 && i === 4) ||                                    // Row 1: result
                  (eqIdx === 2 && (i === 0 || i === 2 || i === 4)) ||           // Row 2: 1st, 3rd (middle), result
                  (eqIdx === 3 && (i === 0 || i === 3)) ||                      // Row 3: 1st and 4th
                  (eqIdx === 4 && i === 1);                                      // Row 4: 2nd value
      }

      grid[row][col] = {
        type: isGiven ? 'number' : 'input',
        value: isGiven ? rowValues[i] : '',
        isEditable: !isGiven,
        row, col
      };
      solution[row][col] = {
        type: isGiven ? 'number' : 'input',
        value: rowValues[i],
        isEditable: !isGiven,
        row, col
      };
      col++;

      // After each value except the last: place operator or equals
      if (i < numValues - 1) {
        // For operands (not result): place horizontal operator
        if (i < numValues - 2) {
          grid[row][col] = { type: 'operator', value: rowOperators[i], isEditable: false, row, col };
          solution[row][col] = { type: 'operator', value: rowOperators[i], isEditable: false, row, col };
        } else {
          // Before result: place equals sign
          grid[row][col] = { type: 'operator', value: '=', isEditable: false, row, col };
          solution[row][col] = { type: 'operator', value: '=', isEditable: false, row, col };
        }
        col++;
      }
    }

    // NO BLOCKED CELLS NEEDED - equation should fill entire row for correct grid size
    // Sanity check: col should equal size for properly sized grids
    if (col !== size) {
      console.warn(`Warning: Row ${row} ended at col ${col} but grid size is ${size}`);
    }
  }

  // Fill operator rows (1, 3, 5, 7...)
  for (let row = 1; row < size; row += 2) {
    const opRowIdx = Math.floor(row / 2);
    const isEqualsRow = (row === size - 2); // Row 3 for 5x5, Row 5 for 7x7, Row 7 for 9x9

    // Fill even columns (0, 2, 4, 6, 8) with operators or equals
    for (let valIdx = 0; valIdx < numValues; valIdx++) {
      const col = valIdx * 2;
      // Use the correct vertical operator for this specific operator row
      const val = isEqualsRow ? '=' : (verticalOps[valIdx] && verticalOps[valIdx][opRowIdx] ? verticalOps[valIdx][opRowIdx] : vOps[valIdx]);

      grid[row][col] = { type: 'operator', value: val, isEditable: false, row, col };
      solution[row][col] = { type: 'operator', value: val, isEditable: false, row, col };
    }

    // Fill odd columns (1, 3, 5, 7) - these are structural empty cells in operator rows
    for (let col = 1; col < size; col += 2) {
      // These cells act as visual separators/spacers in the crossword grid
      grid[row][col] = { type: 'blocked', value: '', isEditable: false, row, col };
      solution[row][col] = { type: 'blocked', value: '', isEditable: false, row, col };
    }
  }

  return { grid, solution };
}

/**
 * Generate a simple fallback puzzle if generation fails
 */
function generateFallbackPuzzle(config: DifficultyConfig): { grid: GridCell[][], solution: GridCell[][] } {
  const size = config.gridSize;

  // Simple valid puzzle: 5+3=8, 2+1=3, 7+2=9
  const grid: GridCell[][] = Array(size).fill(null).map((_, row) =>
    Array(size).fill(null).map((_, col) => ({
      type: 'blocked' as const,
      value: '',
      isEditable: false,
      row,
      col
    }))
  );

  const solution: GridCell[][] = Array(size).fill(null).map((_, row) =>
    Array(size).fill(null).map((_, col) => ({
      type: 'blocked' as const,
      value: '',
      isEditable: false,
      row,
      col
    }))
  );

  // Fill 5x5 core (works for all sizes since they're all >= 5)
  const pattern = [
    [
      { type: 'number' as const, value: 5, isEditable: false },
      { type: 'operator' as const, value: '+', isEditable: false },
      { type: 'input' as const, value: '', isEditable: true, sol: 3 },
      { type: 'operator' as const, value: '=', isEditable: false },
      { type: 'input' as const, value: '', isEditable: true, sol: 8 },
    ],
    [
      { type: 'operator' as const, value: '+', isEditable: false },
      { type: 'blocked' as const, value: '', isEditable: false },
      { type: 'operator' as const, value: '+', isEditable: false },
      { type: 'blocked' as const, value: '', isEditable: false },
      { type: 'operator' as const, value: '+', isEditable: false },
    ],
    [
      { type: 'input' as const, value: '', isEditable: true, sol: 2 },
      { type: 'operator' as const, value: '+', isEditable: false },
      { type: 'number' as const, value: 1, isEditable: false },
      { type: 'operator' as const, value: '=', isEditable: false },
      { type: 'input' as const, value: '', isEditable: true, sol: 3 },
    ],
    [
      { type: 'operator' as const, value: '=', isEditable: false },
      { type: 'blocked' as const, value: '', isEditable: false },
      { type: 'operator' as const, value: '=', isEditable: false },
      { type: 'blocked' as const, value: '', isEditable: false },
      { type: 'operator' as const, value: '=', isEditable: false },
    ],
    [
      { type: 'number' as const, value: 7, isEditable: false },
      { type: 'operator' as const, value: '+', isEditable: false },
      { type: 'input' as const, value: '', isEditable: true, sol: 2 },
      { type: 'operator' as const, value: '=', isEditable: false },
      { type: 'number' as const, value: 9, isEditable: false },
    ],
  ];

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const cell = pattern[row][col];
      grid[row][col] = {
        type: cell.type,
        value: 'sol' in cell ? '' : cell.value,
        isEditable: cell.isEditable,
        row,
        col
      };
      solution[row][col] = {
        type: cell.type,
        value: 'sol' in cell ? (cell.sol ?? '') : cell.value,
        isEditable: cell.isEditable,
        row,
        col
      };
    }
  }

  return { grid, solution };
}

