import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDifficultyChange: (difficulty: 'easy' | 'medium' | 'hard') => void;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function SettingsModal({
  isOpen,
  onClose,
  onDifficultyChange,
  difficulty
}: SettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4" data-testid="settings-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-card-foreground">
            Game Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Customize your game experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Difficulty Selector */}
          <div>
            <h3 className="text-lg font-bold text-card-foreground mb-4">Difficulty</h3>
            <RadioGroup
              value={difficulty}
              onValueChange={(value) => onDifficultyChange(value as 'easy' | 'medium' | 'hard')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="easy" id="easy" />
                <Label htmlFor="easy" className="flex-1 cursor-pointer">
                  <div>
                    <span className="font-medium text-card-foreground">Easy</span>
                    <p className="text-sm text-muted-foreground">5x5 grid, basic operations</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="flex-1 cursor-pointer">
                  <div>
                    <span className="font-medium text-card-foreground">Medium</span>
                    <p className="text-sm text-muted-foreground">7x7 grid, mixed operations</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="hard" id="hard" />
                <Label htmlFor="hard" className="flex-1 cursor-pointer">
                  <div>
                    <span className="font-medium text-card-foreground">Hard</span>
                    <p className="text-sm text-muted-foreground">9x9 grid, advanced equations</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}