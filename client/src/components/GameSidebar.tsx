interface GameSidebarProps {
  stats: {
    totalSolved: number;
    bestTime: string;
    averageTime: string;
    hintsUsed: number;
  };
}

export function GameSidebar({
  stats
}: GameSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Game Statistics */}
      <div className="bg-card rounded-xl shadow-lg border border-border p-6">
        <h3 className="text-lg font-bold text-card-foreground mb-4">Statistics</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Puzzles Solved</span>
            <span className="font-bold text-card-foreground" data-testid="stat-total-solved">
              {stats.totalSolved}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Best Time</span>
            <span className="font-mono font-bold text-card-foreground" data-testid="stat-best-time">
              {stats.bestTime}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Average Time</span>
            <span className="font-mono font-bold text-card-foreground" data-testid="stat-average-time">
              {stats.averageTime}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Hints Used</span>
            <span className="font-bold text-card-foreground" data-testid="stat-hints-used">
              {stats.hintsUsed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
