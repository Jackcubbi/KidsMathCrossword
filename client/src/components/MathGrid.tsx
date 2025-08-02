import { Input } from '@/components/ui/input';
import { Check, Clock } from 'lucide-react';
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
}

export function MathGrid({ 
  grid, 
  onCellChange, 
  equationStatus, 
  completedEquations, 
  totalEquations 
}: MathGridProps) {
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
        return (
          <div 
            key={`${row}-${col}`}
            className={`${baseClasses} bg-secondary border-secondary hover:bg-secondary/80 transition-colors cursor-pointer`}
          >
            <Input
              type="number"
              value={cell.value === 0 ? '' : cell.value.toString()}
              onChange={(e) => onCellChange(row, col, e.target.value)}
              className="grid-cell-input text-secondary-foreground"
              placeholder="?"
              min="-99"
              max="99"
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-card-foreground">Puzzle Grid</h2>
        <div className="flex space-x-2">
          <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
            Level 3
          </div>
          <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
            <span data-testid="completed-equations">{completedEquations}</span>/
            <span data-testid="total-equations">{totalEquations}</span> Complete
          </div>
        </div>
      </div>

      {/* 5x5 Mathematical Grid */}
      <div className="grid grid-cols-5 gap-1 mx-auto bg-border p-2 rounded-lg w-fit">
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
                <div key={`h-${index}`} className="flex items-center space-x-2">
                  <div 
                    className={`w-4 h-4 rounded-full ${
                      equation.isValid ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                  <span className="text-sm font-mono flex-1">
                    Row {equation.row + 1}: {equation.equation}
                  </span>
                  {equation.isValid ? (
                    <Check className="text-primary text-sm" size={16} />
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
                <div key={`v-${index}`} className="flex items-center space-x-2">
                  <div 
                    className={`w-4 h-4 rounded-full ${
                      equation.isValid ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                  <span className="text-sm font-mono flex-1">
                    Col {equation.col + 1}: {equation.equation}
                  </span>
                  {equation.isValid ? (
                    <Check className="text-primary text-sm" size={16} />
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
