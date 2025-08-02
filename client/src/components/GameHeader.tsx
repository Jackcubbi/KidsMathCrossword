import { Calculator, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameHeaderProps {
  formattedTime: string;
  onSettingsClick?: () => void;
}

export function GameHeader({ formattedTime, onSettingsClick }: GameHeaderProps) {
  return (
    <header className="bg-card shadow-lg border-b border-border">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-primary-foreground rounded-lg p-2">
              <Calculator className="text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">KidsMath Cross Demo</h1>
              <p className="text-muted-foreground text-sm">Solve the equations in the grid</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Timer Display */}
            <div className="bg-accent rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <i className="fas fa-clock text-accent-foreground"></i>
                <span 
                  className="font-mono text-lg font-bold text-accent-foreground" 
                  data-testid="timer-display"
                >
                  {formattedTime}
                </span>
              </div>
            </div>
            {/* Settings Button */}
            <Button
              variant="ghost"
              size="icon"
              className="bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground"
              onClick={onSettingsClick}
              data-testid="button-settings"
            >
              <Settings className="text-lg" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
