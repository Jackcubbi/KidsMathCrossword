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
      }
      
      return result;
    } catch (error) {
      console.error('Failed to validate solution:', error);
      return null;
    }
  };

  const getHint = () => {
    if (!puzzle || !puzzle.solution) return;
    
    // Find first empty editable cell and provide its solution
    for (let row = 0; row < gameState.grid.length; row++) {
      for (let col = 0; col < gameState.grid[row].length; col++) {
        const cell = gameState.grid[row][col];
        if (cell.isEditable && (cell.value === '' || cell.value === 0)) {
          const solutionValue = puzzle.solution[row][col].value;
          updateCell(row, col, solutionValue.toString());
          setGameState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
          return;
        }
      }
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

    // Check horizontal equations (rows 0, 2, 4)
    for (const row of [0, 2, 4]) {
      if (gameState.grid[row]) {
        const cells = gameState.grid[row];
        const num1 = parseFloat(cells[0]?.value?.toString() || '0') || 0;
        const operator = cells[1]?.value;
        const num2 = parseFloat(cells[2]?.value?.toString() || '0') || 0;
        const result = parseFloat(cells[4]?.value?.toString() || '0') || 0;

        let expected = 0;
        let isComplete = false;
        
        if (operator === '+') {
          expected = num1 + num2;
          isComplete = cells[0]?.value !== '' && cells[2]?.value !== '' && cells[4]?.value !== '';
        } else if (operator === '-') {
          expected = num1 - num2;
          isComplete = cells[0]?.value !== '' && cells[2]?.value !== '' && cells[4]?.value !== '';
        }

        horizontal.push({
          row,
          equation: `${num1} ${operator} ${num2} = ${result}`,
          isValid: expected === result && isComplete,
          isComplete,
        });
      }
    }

    // Check vertical equations (cols 0, 2, 4)
    for (const col of [0, 2, 4]) {
      if (gameState.grid.length >= 5) {
        const num1 = parseFloat(gameState.grid[0][col]?.value?.toString() || '0') || 0;
        const operator = gameState.grid[1][col]?.value;
        const num2 = parseFloat(gameState.grid[2][col]?.value?.toString() || '0') || 0;
        const result = parseFloat(gameState.grid[4][col]?.value?.toString() || '0') || 0;

        let expected = 0;
        let isComplete = false;
        
        if (operator === '+') {
          expected = num1 + num2;
          isComplete = gameState.grid[0][col]?.value !== '' && gameState.grid[2][col]?.value !== '' && gameState.grid[4][col]?.value !== '';
        } else if (operator === '-') {
          expected = num1 - num2;
          isComplete = gameState.grid[0][col]?.value !== '' && gameState.grid[2][col]?.value !== '' && gameState.grid[4][col]?.value !== '';
        }

        vertical.push({
          col,
          equation: `${num1} ${operator} ${num2} = ${result}`,
          isValid: expected === result && isComplete,
          isComplete,
        });
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
