import { Input } from '@/components/ui/input';
import { Check, Clock, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { GridCell } from '@shared/schema';

interface MathGridProps {
  grid: GridCell[][];
  onCellChange: (row: number, col: number, value: string) => void;
  equationStatus: {
    horizontal: Array<{ row: number; equation: string; isValid: boolean; isComplete: boolean }>;
    vertical: Array<{ col: number; equation: string; isValid: boolean; isComplete: boolean }>;
  };
  completedEquations: number;
  totalEquations: number;
  disabled?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  hintsUsed?: number;
}

export function MathGrid({
  grid,
  onCellChange,
  equationStatus,
  completedEquations,
  totalEquations,
  disabled = false,
  difficulty = 'medium',
  hintsUsed = 0
}: MathGridProps) {
  const { user } = useAuth();
  const [hoveredEquation, setHoveredEquation] = useState<{ type: 'horizontal' | 'vertical'; index: number } | null>(null);
  const [cellValidation, setCellValidation] = useState<Record<string, 'correct' | 'incorrect' | null>>({});
  const [combo, setCombo] = useState(0);
  const [previousCompleted, setPreviousCompleted] = useState(0);
  const [previousHintsUsed, setPreviousHintsUsed] = useState(0);

  // Check if user is registered (not guest) - only real logged-in users get combo
  const isRegisteredUser = user && user.id && user.id !== 'default-user';

  // Track hint usage and decrease combo
  useEffect(() => {
    if (hintsUsed > previousHintsUsed) {
      // Hint was used - decrease combo by 1
      setCombo(prev => Math.max(0, prev - 1));
      setPreviousHintsUsed(hintsUsed);
    }
  }, [hintsUsed, previousHintsUsed]);

  // Track combo when equations are completed (only for registered users)
  useEffect(() => {
    if (isRegisteredUser && completedEquations > previousCompleted) {
      const newEquationsCompleted = completedEquations - previousCompleted;
      setCombo(prev => prev + newEquationsCompleted);
      setPreviousCompleted(completedEquations);

      // Reset combo after 3 seconds of inactivity
      const timer = setTimeout(() => {
        setCombo(0);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [completedEquations, previousCompleted, isRegisteredUser]);

  // Update cell validation states
  useEffect(() => {
    const newValidation: Record<string, 'correct' | 'incorrect' | null> = {};

    // Check horizontal equations - only mark correct ones
    equationStatus.horizontal.forEach((eq, idx) => {
      const row = eq.row;
      if (eq.isComplete && eq.isValid) {
        for (let col = 0; col < grid[row]?.length; col++) {
          const cell = grid[row][col];
          if (cell?.isEditable && cell.value !== '' && cell.value !== null && cell.value !== undefined) {
            const key = `${row}-${col}`;
            newValidation[key] = 'correct';
          }
        }
      }
    });

    // Check vertical equations - only mark correct ones
    equationStatus.vertical.forEach((eq, idx) => {
      const col = eq.col;
      if (eq.isComplete && eq.isValid) {
        for (let row = 0; row < grid.length; row++) {
          const cell = grid[row]?.[col];
          if (cell?.isEditable && cell.value !== '' && cell.value !== null && cell.value !== undefined) {
            const key = `${row}-${col}`;
            newValidation[key] = 'correct';
          }
        }
      }
    });

    setCellValidation(newValidation);
  }, [equationStatus, grid]);

  // Check if a cell is part of the hovered equation
  const isCellInHoveredEquation = (row: number, col: number): boolean => {
    if (!hoveredEquation) return false;

    if (hoveredEquation.type === 'horizontal') {
      return row === equationStatus.horizontal[hoveredEquation.index]?.row;
    } else {
      return col === equationStatus.vertical[hoveredEquation.index]?.col;
    }
  };

  // Get difficulty description based on grid size and difficulty level
  const getDifficultyDescription = () => {
    const gridSize = grid.length;
    const difficultyName = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

    if (gridSize === 5) {
      return `${difficultyName}: - Basic operations`;
    } else if (gridSize === 7) {
      return `${difficultyName}: - Mixed operations`;
    } else if (gridSize === 9) {
      return `${difficultyName}:  - Advanced equations`;
    }
    return `${difficultyName}\n${gridSize}x${gridSize} grid`;
  };

  // Get placeholder equation based on grid size
  const getPlaceholderEquation = () => {
    const gridSize = grid.length;
    if (gridSize === 5) {
      return 'x + x = x';
    } else if (gridSize === 7) {
      return 'x + x + x = x';
    } else if (gridSize === 9) {
      return 'x + x = x + x = x';
    }
    return 'x + x + x = x';
  };

  const renderCell = (cell: GridCell, row: number, col: number) => {
    const baseClasses = "w-16 h-16 flex items-center justify-center rounded-md border-2";

    switch (cell.type) {
      case 'number':
        return (
          <div
            key={`${row}-${col}`}
            className={`${baseClasses} bg-card border-border`}
          >
            <span className="font-bold text-card-foreground" style={{ fontSize: '24px' }}>
              {cell.value}
            </span>
          </div>
        );

      case 'operator':
        return (
          <div
            key={`${row}-${col}`}
            className={`${baseClasses} bg-muted border-border`}
          >
            <span className="font-bold text-muted-foreground" style={{ fontSize: '24px' }}>
              {cell.value}
            </span>
          </div>
        );

      case 'input':
        const cellKey = `${row}-${col}`;
        const validationState = cellValidation[cellKey];
        const isHighlighted = isCellInHoveredEquation(row, col);
        const isEmpty = cell.value === '' || cell.value === null || cell.value === undefined;

        // Determine cell background color based on state
        let cellBgClass = 'bg-secondary';
        let cellBorderClass = 'border-secondary';
        let cellTextClass = 'text-secondary-foreground';

        if (validationState === 'correct') {
          cellBgClass = 'bg-green-100 dark:bg-green-900/30';
          cellBorderClass = 'border-green-500';
          cellTextClass = 'text-green-700 dark:text-green-300';
        } else if (!isEmpty) {
          cellBgClass = 'bg-blue-50 dark:bg-blue-900/20';
          cellBorderClass = 'border-blue-300 dark:border-blue-700';
        }

        if (isHighlighted) {
          cellBorderClass = 'border-primary border-4';
        }

        return (
          <div
            key={`${row}-${col}`}
            className={`${baseClasses} ${cellBgClass} ${cellBorderClass} hover:scale-105 transition-all duration-200 cursor-pointer ${validationState === 'correct' ? 'animate-pulse-once' : ''}`}
          >
            <Input
              type="number"
              value={cell.value === '' || cell.value === null || cell.value === undefined ? '' : cell.value.toString()}
              onChange={(e) => onCellChange(row, col, e.target.value)}
              className={`grid-cell-input ${cellTextClass}`}
              placeholder="?"
              min="-99"
              max="99"
              disabled={disabled}
              data-testid={`input-cell-${row}-${col}`}
            />
          </div>
        );

      case 'blocked':
      default:
        return (
          <div
            key={`${row}-${col}`}
            className={`${baseClasses} bg-gray-800 border-gray-700`}
          />
        );
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border p-6">
      {/* Combo Counter - Only for registered users */}
      {isRegisteredUser && combo > 1 && (
        <div className="mb-4 flex items-center justify-center">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce-subtle flex items-center gap-2">
            <Zap className="w-5 h-5 animate-pulse" />
            <span className="text-lg font-bold">{combo}x COMBO!</span>
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-card-foreground">Puzzle Grid</h2>
        <p className="text-muted-foreground text-md whitespace-pre-line">{getDifficultyDescription()}</p>
        <div className="flex space-x-2">
          <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
            Level 1
          </div>
          <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
            <span data-testid="completed-equations">{completedEquations}</span>/
            <span data-testid="total-equations">{totalEquations}</span> Complete
          </div>
        </div>
      </div>

      {/* Dynamic Mathematical Grid (5x5, 7x7, or 9x9) */}
      <div
        className="grid gap-1 mx-auto bg-border p-2 rounded-lg w-fit"
        style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 5}, minmax(0, 1fr))` }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))
        )}
      </div>

      {/* Equation Validation Status */}
      <div className="mt-6 space-y-2">
        <h3 className="font-semibold text-card-foreground mb-3">Equation Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Horizontal Equations */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Horizontal</h4>
            <div className="space-y-1">
              {equationStatus.horizontal.map((equation, index) => (
                <div
                  key={`h-${index}`}
                  className="flex items-center space-x-2 p-2 rounded-md transition-all duration-200 hover:bg-accent cursor-pointer"
                  onMouseEnter={() => setHoveredEquation({ type: 'horizontal', index })}
                  onMouseLeave={() => setHoveredEquation(null)}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      equation.isValid ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-muted'
                    }`}
                  />
                  <span className="text-sm font-mono flex-1">
                    Row {equation.row + 1}: {disabled ? getPlaceholderEquation() : equation.equation}
                  </span>
                  {equation.isValid ? (
                    <Check className="text-green-500 text-sm" size={16} />
                  ) : (
                    <Clock className="text-muted-foreground text-sm" size={16} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Vertical Equations */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Vertical</h4>
            <div className="space-y-1">
              {equationStatus.vertical.map((equation, index) => (
                <div
                  key={`v-${index}`}
                  className="flex items-center space-x-2 p-2 rounded-md transition-all duration-200 hover:bg-accent cursor-pointer"
                  onMouseEnter={() => setHoveredEquation({ type: 'vertical', index })}
                  onMouseLeave={() => setHoveredEquation(null)}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      equation.isValid ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-muted'
                    }`}
                  />
                  <span className="text-sm font-mono flex-1">
                    Col {equation.col + 1}: {disabled ? getPlaceholderEquation() : equation.equation}
                  </span>
                  {equation.isValid ? (
                    <Check className="text-green-500 text-sm" size={16} />
                  ) : (
                    <Clock className="text-muted-foreground text-sm" size={16} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
