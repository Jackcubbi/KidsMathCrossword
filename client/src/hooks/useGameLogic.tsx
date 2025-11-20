import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import type { GridCell, GameState, Puzzle } from '@shared/schema';

export function useGameLogic(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    difficulty,
    isCompleted: false,
    hintsUsed: 0,
    startTime: Date.now(),
  });

  const [gameSessionId, setGameSessionId] = useState<string | null>(null);

  // Fetch puzzle
  const { data: puzzle, isLoading } = useQuery<Puzzle>({
    queryKey: ['/api/puzzles', difficulty],
    enabled: true,
  });

  // Validate solution mutation
  const validateSolutionMutation = useMutation({
    mutationFn: async (grid: GridCell[][]) => {
      const response = await apiRequest('POST', '/api/validate-solution', { grid });
      return response.json();
    },
  });

  // Create game session mutation
  const createGameSessionMutation = useMutation({
    mutationFn: async (puzzleId: string) => {
      const response = await apiRequest('POST', '/api/game-sessions', {
        puzzleId,
        hintsUsed: 0,
        isCompleted: false,
      });
      return response.json();
    },
  });

  // Update game session mutation
  const updateGameSessionMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!gameSessionId) return;
      const response = await apiRequest('PATCH', `/api/game-sessions/${gameSessionId}`, updates);
      return response.json();
    },
  });

  // Initialize game when puzzle is loaded
  useEffect(() => {
    if (puzzle && puzzle.grid) {
      setGameState(prev => ({
        ...prev,
        grid: puzzle.grid.map((row: GridCell[]) =>
          row.map((cell: GridCell) => ({ ...cell, value: cell.isEditable ? '' : cell.value }))
        ),
        startTime: Date.now(),
      }));

      // Create a game session for tracking stats
      createGameSessionMutation.mutateAsync(puzzle.id).then((session) => {
        setGameSessionId(session.id);
      }).catch((error) => {
        console.error('Failed to create game session:', error);
      });
    }
  }, [puzzle]);

  const updateCell = (row: number, col: number, value: string) => {
    if (!gameState.grid[row] || !gameState.grid[row][col] || !gameState.grid[row][col].isEditable) {
      return;
    }

    // Validate numeric input
    const numValue = parseFloat(value);
    if (value !== '' && (isNaN(numValue) || numValue < -99 || numValue > 99)) {
      return;
    }

    setGameState(prev => ({
      ...prev,
      grid: prev.grid.map((gridRow, r) =>
        gridRow.map((cell, c) =>
          r === row && c === col ? { ...cell, value: value === '' ? '' : numValue } : cell
        )
      ),
    }));
  };

  const validateSolution = async () => {
    if (!gameState.grid.length) return;

    try {
      const result = await validateSolutionMutation.mutateAsync(gameState.grid);

      if (result.isValid) {
        const completionTime = Math.floor((Date.now() - gameState.startTime) / 1000);
        setGameState(prev => ({
          ...prev,
          isCompleted: true,
          completionTime
        }));

        // Update game session
        await updateGameSessionMutation.mutateAsync({
          isCompleted: true,
          completionTime,
          hintsUsed: gameState.hintsUsed,
        });

        // Invalidate stats query to update the sidebar
        queryClient.invalidateQueries({ queryKey: ['/api/stats', 'default-user'] });
      }

      return result;
    } catch (error) {
      console.error('Failed to validate solution:', error);
      return null;
    }
  };

  const getHint = () => {
    if (!puzzle || !puzzle.solution) return;

    // Collect all empty editable cells
    const emptyCells: { row: number; col: number }[] = [];
    for (let row = 0; row < gameState.grid.length; row++) {
      for (let col = 0; col < gameState.grid[row].length; col++) {
        const cell = gameState.grid[row][col];
        // Only check for empty string, not 0 (which is a valid value)
        if (cell.isEditable && cell.value === '') {
          emptyCells.push({ row, col });
        }
      }
    }

    // If there are empty cells, randomly select one and fill it
    if (emptyCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const { row, col } = emptyCells[randomIndex];
      const solutionValue = puzzle.solution[row][col].value;
      updateCell(row, col, solutionValue.toString());
      setGameState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
    }
  };

  const resetGame = () => {
    if (puzzle) {
      setGameState(prev => ({
        ...prev,
        grid: puzzle.grid.map((row: GridCell[]) =>
          row.map((cell: GridCell) => ({ ...cell, value: cell.isEditable ? '' : cell.value }))
        ),
        isCompleted: false,
        hintsUsed: 0,
        startTime: Date.now(),
      }));
    }
  };

  const getEquationStatus = () => {
    if (!gameState.grid.length) return { horizontal: [], vertical: [] };

    const horizontal = [];
    const vertical = [];

    const gridSize = gameState.grid.length;

    // Helper function to evaluate equation with proper order of operations
    const evaluateEquation = (values: number[], operators: string[]): number => {
      // Apply order of operations: multiplication and division first, then addition and subtraction
      const nums = [...values];
      const ops = [...operators];

      // First pass: handle * and /
      for (let i = 0; i < ops.length; i++) {
        if (ops[i] === '*' || ops[i] === '/') {
          const result = ops[i] === '*'
            ? nums[i] * nums[i + 1]
            : nums[i] / nums[i + 1];
          nums.splice(i, 2, result);
          ops.splice(i, 1);
          i--; // Recheck the same index
        }
      }

      // Second pass: handle + and -
      let result = nums[0];
      for (let i = 0; i < ops.length; i++) {
        switch (ops[i]) {
          case '+': result = result + nums[i + 1]; break;
          case '-': result = result - nums[i + 1]; break;
          default: result = 0;
        }
      }
      return result;
    };

    // Check if this is a 9x9 grid with dual equations
    const isDualEquation = gridSize === 9;

    // Check horizontal equations (rows 0, 2, 4, ... for all even rows)
    for (let row = 0; row < gridSize; row += 2) {
      if (gameState.grid[row]) {
        const cells = gameState.grid[row];

        if (isDualEquation) {
          // For 9x9: TWO mini-equations per row
          // Structure: v0 op v1 = r1 op v2 = r2
          // Cols:      0  1  2  3  4  5  6  7  8

          const v0 = parseFloat(cells[0]?.value?.toString() || '0') || 0;
          const op1 = cells[1]?.value?.toString() || '+';
          const v1 = parseFloat(cells[2]?.value?.toString() || '0') || 0;
          const r1 = parseFloat(cells[4]?.value?.toString() || '0') || 0;
          const op2 = cells[5]?.value?.toString() || '+';
          const v2 = parseFloat(cells[6]?.value?.toString() || '0') || 0;
          const r2 = parseFloat(cells[8]?.value?.toString() || '0') || 0;

          // Check completeness
          const isComplete = [0, 2, 4, 6, 8].every(col => {
            const cellValue = cells[col]?.value;
            return cellValue !== '' && cellValue !== undefined && cellValue !== null;
          });

          // Validate first mini-equation: v0 op1 v1 = r1
          const expected1 = evaluateEquation([v0, v1], [op1]);
          const isValid1 = Math.abs(expected1 - r1) < 0.001;

          // Validate second mini-equation: r1 op2 v2 = r2
          const expected2 = evaluateEquation([r1, v2], [op2]);
          const isValid2 = Math.abs(expected2 - r2) < 0.001;

          const equation = `${v0} ${op1} ${v1} = ${r1}, ${r1} ${op2} ${v2} = ${r2}`;

          horizontal.push({
            row,
            equation,
            isValid: (isValid1 && isValid2 && isComplete),
            isComplete,
          });
        } else {
          // For 5x5/7x7: ONE equation per row with order of operations
          const values: number[] = [];
          const operators: string[] = [];

          for (let col = 0; col < gridSize; col++) {
            const cell = cells[col];
            if (!cell) continue;

            if (cell.type === 'number' || cell.type === 'input') {
              const val = parseFloat(cell.value?.toString() || '0') || 0;
              values.push(val);
            } else if (cell.type === 'operator' && cell.value !== '=') {
              operators.push(cell.value?.toString() || '+');
            }
          }

          if (values.length >= 2) {
            // Calculate expected result with proper order of operations
            const operands = values.slice(0, -1);
            const expected = evaluateEquation(operands, operators);

            const result = values[values.length - 1];

            // Build equation string
            let equation = values[0].toString();
            for (let i = 0; i < operators.length && i < values.length - 1; i++) {
              equation += ` ${operators[i]} ${values[i + 1]}`;
            }
            equation += ` = ${result}`;

            // Check if all value cells in this row are filled
            let isComplete = true;
            for (let col = 0; col < gridSize; col += 2) {
              const cellValue = cells[col]?.value;
              if (cellValue === '' || cellValue === undefined || cellValue === null) {
                isComplete = false;
                break;
              }
            }

            horizontal.push({
              row,
              equation,
              isValid: Math.abs(expected - result) < 0.001 && isComplete,
              isComplete,
            });
          }
        }
      }
    }

    // Check vertical equations (cols 0, 2, 4, 6, 8 ... for all even cols)
    for (let col = 0; col < gridSize; col += 2) {
      if (isDualEquation) {
        // For 9x9: TWO mini-equations vertically
        // Extract values at rows 0,2,4,6,8 (5 values)
        // Extract operators at rows 1,5 (2 operators)
        // Structure: v0 op1 v1 = r1 op2 v2 = r2

        const v0 = parseFloat(gameState.grid[0]?.[col]?.value?.toString() || '0') || 0;
        const v1 = parseFloat(gameState.grid[2]?.[col]?.value?.toString() || '0') || 0;
        const r1 = parseFloat(gameState.grid[4]?.[col]?.value?.toString() || '0') || 0;
        const v2 = parseFloat(gameState.grid[6]?.[col]?.value?.toString() || '0') || 0;
        const r2 = parseFloat(gameState.grid[8]?.[col]?.value?.toString() || '0') || 0;

        const op1 = gameState.grid[1]?.[col]?.value?.toString() || '+';
        const op2 = gameState.grid[5]?.[col]?.value?.toString() || '+';

        // Validate first mini-equation: v0 op1 v1 = r1
        const expected1 = evaluateEquation([v0, v1], [op1]);
        const isValid1 = Math.abs(expected1 - r1) < 0.001;

        // Validate second mini-equation: r1 op2 v2 = r2
        const expected2 = evaluateEquation([r1, v2], [op2]);
        const isValid2 = Math.abs(expected2 - r2) < 0.001;

        // Check if all value cells are filled
        let isComplete = true;
        for (let row = 0; row < gridSize; row += 2) {
          const cellValue = gameState.grid[row]?.[col]?.value;
          if (cellValue === '' || cellValue === undefined || cellValue === null) {
            isComplete = false;
            break;
          }
        }

        const equation = `${v0} ${op1} ${v1} = ${r1}, ${r1} ${op2} ${v2} = ${r2}`;
        const isValid = isValid1 && isValid2 && isComplete;

        vertical.push({
          col,
          equation,
          isValid,
          isComplete,
        });
      } else {
        // For 5x5 and 7x7: single equation with order of operations
        const values: number[] = [];
        const operators: string[] = [];

        for (let row = 0; row < gridSize; row++) {
          const cell = gameState.grid[row]?.[col];
          if (!cell) continue;

          if (cell.type === 'number' || cell.type === 'input') {
            const val = parseFloat(cell.value?.toString() || '0') || 0;
            values.push(val);
          } else if (cell.type === 'operator' && cell.value !== '=') {
            operators.push(cell.value?.toString() || '+');
          }
        }

        if (values.length >= 2) {
          // Calculate expected result with proper order of operations
          const operands = values.slice(0, -1);
          const expected = evaluateEquation(operands, operators);

          const result = values[values.length - 1];

          // Build equation string
          let equation = values[0].toString();
          for (let i = 0; i < operators.length && i < values.length - 1; i++) {
            equation += ` ${operators[i]} ${values[i + 1]}`;
          }
          equation += ` = ${result}`;

          // Check if all cells in this column are filled
          let isComplete = true;
          for (let row = 0; row < gridSize; row += 2) {
            const cellValue = gameState.grid[row]?.[col]?.value;
            if (cellValue === '' || cellValue === undefined || cellValue === null) {
              isComplete = false;
              break;
            }
          }

          vertical.push({
            col,
            equation,
            isValid: Math.abs(expected - result) < 0.001 && isComplete,
            isComplete,
          });
        }
      }
    }

    return { horizontal, vertical };
  };

  return {
    gameState,
    isLoading,
    updateCell,
    validateSolution,
    getHint,
    resetGame,
    getEquationStatus,
    isValidating: validateSolutionMutation.isPending,
  };
}
