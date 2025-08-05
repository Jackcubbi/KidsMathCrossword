import { useState, useEffect, useRef } from "react";
import type { CrosswordData } from "@/types/crossword";

interface CrosswordGridProps {
  crossword: CrosswordData;
  onComplete: () => void;
  disabled?: boolean;
}

export default function CrosswordGrid({ crossword, onComplete, disabled = false }: CrosswordGridProps) {
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [cellStates, setCellStates] = useState<{ [key: string]: 'correct' | 'incorrect' | '' }>({});
  const gridRef = useRef<HTMLDivElement>(null);

  const grid = crossword.content.grid;
  const answers = crossword.content.answers;

  useEffect(() => {
    // Reset states when crossword changes
    setUserAnswers({});
    setCellStates({});
  }, [crossword.id]);

  const handleCellChange = (row: number, col: number, value: string) => {
    if (disabled) return;
    
    const key = `${row}-${col}`;
    setUserAnswers(prev => ({
      ...prev,
      [key]: value.toUpperCase()
    }));
    
    // Clear previous state
    setCellStates(prev => ({
      ...prev,
      [key]: ''
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    if (disabled) return;
    
    let nextRow = row;
    let nextCol = col;
    
    switch (e.key) {
      case 'ArrowUp':
        nextRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        nextRow = Math.min(grid.length - 1, row + 1);
        break;
      case 'ArrowLeft':
        nextCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        nextCol = Math.min(grid[0].length - 1, col + 1);
        break;
      default:
        return;
    }
    
    e.preventDefault();
    const nextInput = gridRef.current?.querySelector(`[data-row="${nextRow}"][data-col="${nextCol}"]`) as HTMLInputElement;
    if (nextInput && !nextInput.disabled) {
      nextInput.focus();
    }
  };

  const checkAnswers = () => {
    if (disabled) return;
    
    const newCellStates: { [key: string]: 'correct' | 'incorrect' | '' } = {};
    let allCorrect = true;
    let hasAnswers = false;

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = grid[row][col];
        if (cell.editable) {
          const key = `${row}-${col}`;
          const userAnswer = userAnswers[key] || '';
          const correctAnswer = answers[row][col] || '';
          
          if (userAnswer) {
            hasAnswers = true;
            if (userAnswer === correctAnswer) {
              newCellStates[key] = 'correct';
            } else {
              newCellStates[key] = 'incorrect';
              allCorrect = false;
            }
          } else {
            allCorrect = false;
          }
        }
      }
    }

    setCellStates(newCellStates);

    if (allCorrect && hasAnswers) {
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  const getCellClassName = (row: number, col: number) => {
    const cell = grid[row][col];
    const key = `${row}-${col}`;
    const state = cellStates[key];
    
    let className = "crossword-cell";
    
    if (!cell.editable) {
      className += " readonly";
    }
    
    if (state === 'correct') {
      className += " correct";
    } else if (state === 'incorrect') {
      className += " incorrect";
    }
    
    return className;
  };

  return (
    <div className="crossword-container" ref={gridRef} data-testid="crossword-grid">
      <div className="bg-background p-4 rounded-lg border-2 border-border">
        <div className="grid-container">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="crossword-row">
              {row.map((cell, colIndex) => {
                const key = `${rowIndex}-${colIndex}`;
                return (
                  <input
                    key={key}
                    type="text"
                    className={getCellClassName(rowIndex, colIndex)}
                    value={cell.editable ? (userAnswers[key] || '') : cell.value}
                    disabled={!cell.editable || disabled}
                    maxLength={1}
                    data-row={rowIndex}
                    data-col={colIndex}
                    data-testid={`cell-${rowIndex}-${colIndex}`}
                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <button
          onClick={checkAnswers}
          disabled={disabled}
          className="bg-accent text-accent-foreground px-6 py-2 rounded-lg font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
          data-testid="button-check-grid-answers"
        >
          <i className="fas fa-check mr-2"></i>Check Answers
        </button>
      </div>
    </div>
  );
}
