import { CheckCircle, Lightbulb, RotateCcw, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameControlsProps {
  onCheckSolution: () => void;
  onGetHint: () => void;
  onReset: () => void;
  onStartGame: () => void;
  isValidating: boolean;
  isTimerRunning: boolean;
  gameStarted: boolean;
}

export function GameControls({
  onCheckSolution,
  onGetHint,
  onReset,
  onStartGame,
  isValidating,
  isTimerRunning,
  gameStarted
}: GameControlsProps) {
  return (
    <div className="bg-card rounded-xl shadow-lg border border-border p-6">
      <h3 className="text-lg font-bold text-card-foreground mb-4">Game Controls</h3>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onCheckSolution}
          disabled={isValidating}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
          data-testid="button-check-solution"
        >
          <CheckCircle className="mr-2" size={16} />
          {isValidating ? 'Checking...' : 'Check Solution'}
        </Button>
        <Button
          onClick={onGetHint}
          variant="secondary"
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium px-6"
          data-testid="button-get-hint"
        >
          <Lightbulb className="mr-2" size={16} />
          Get Hint
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          className="bg-muted hover:bg-accent text-muted-foreground font-medium px-6"
          data-testid="button-reset"
        >
          <RotateCcw className="mr-2" size={16} />
          Reset
        </Button>
      </div>
    </div>
  );
}