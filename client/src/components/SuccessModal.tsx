import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewGame: () => void;
  completionTime: string;
  hintsUsed: number;
}

export function SuccessModal({
  isOpen,
  onClose,
  onNewGame,
  completionTime,
  hintsUsed
}: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4" data-testid="success-modal">
        <div className="text-center">
          <div className="bg-primary text-primary-foreground rounded-full p-5 w-16 h-16 mx-auto mb-4">
            <Trophy className="text-2xl" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-card-foreground mb-2">
              Puzzle Completed!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mb-6">
              Great job! You solved all equations correctly.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span
                className="font-mono font-bold text-card-foreground"
                data-testid="completion-time"
              >
                {completionTime}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-muted-foreground">Hints Used:</span>
              <span
                className="font-bold text-card-foreground"
                data-testid="hints-used-in-game"
              >
                {hintsUsed}
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={onNewGame}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              data-testid="button-new-game"
            >
              New Game
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-muted hover:bg-accent text-muted-foreground font-medium"
              data-testid="button-close-modal"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
