import { useAuth } from '@/contexts/AuthContext';

interface DifficultyStats {
  totalSolved: number;
  bestTime: number;
  averageTime: number;
  totalHints: number;
}

interface GameSidebarProps {
  stats: {
    byDifficulty: {
      easy: DifficultyStats;
      medium: DifficultyStats;
      hard: DifficultyStats;
    };
  };
  difficulty: 'easy' | 'medium' | 'hard';
}

const formatTime = (seconds: number): string => {
  if (seconds === 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getGridTitle = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  switch (difficulty) {
    case 'easy': return '5×5 Statistics';
    case 'medium': return '7×7 Statistics';
    case 'hard': return '9×9 Statistics';
  }
};

export function GameSidebar({ stats, difficulty }: GameSidebarProps) {
  const { isAuthenticated } = useAuth();
  const currentStats = stats.byDifficulty[difficulty];

  return (
    <div className="space-y-6">
      {/* Game Statistics */}
      <div className="bg-card rounded-xl shadow-lg border border-border p-6">
        <h3 className="text-lg font-bold text-card-foreground mb-4">{getGridTitle(difficulty)}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Solved:</span>
            <span className="font-bold text-card-foreground" data-testid="stat-total-solved">
              {currentStats.totalSolved}
            </span>
          </div>
          {isAuthenticated && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Best:</span>
                <span className="font-mono font-bold text-card-foreground" data-testid="stat-best-time">
                  {formatTime(currentStats.bestTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Average:</span>
                <span className="font-mono font-bold text-card-foreground" data-testid="stat-average-time">
                  {formatTime(currentStats.averageTime)}
                </span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Hints Used:</span>
            <span className="font-bold text-card-foreground" data-testid="stat-hints-used">
              {currentStats.totalHints}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
