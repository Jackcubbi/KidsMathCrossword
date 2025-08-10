import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GameHeader } from '@/components/GameHeader';
import { MathGrid } from '@/components/MathGrid';
import { GameControls } from '@/components/GameControls';
import { GameSidebar } from '@/components/GameSidebar';
import { SuccessModal } from '@/components/SuccessModal';
import { SettingsModal } from '@/components/SettingsModal';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useTimer } from '@/hooks/useTimer';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const { 
    gameState, 
    isLoading,
    updateCell, 
    validateSolution, 
    getHint, 
    resetGame,
    getEquationStatus,
    isValidating
  } = useGameLogic(difficulty);

  const { formattedTime, start, stop, reset, isRunning } = useTimer();
  const { toast } = useToast();

  // Fetch user statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/stats', 'default-user'],
    enabled: true,
  });

  // Don't auto-start timer anymore - wait for Start button
  // useEffect(() => {
  //   if (gameState.grid.length > 0 && !gameState.isCompleted) {
  //     start();
  //   }
  // }, [gameState.grid, gameState.isCompleted, start]);

  useEffect(() => {
    if (gameState.isCompleted) {
      stop();
      setShowSuccessModal(true);
    }
  }, [gameState.isCompleted, stop]);

  const handleCheckSolution = async () => {
    const result = await validateSolution();
    if (result) {
      if (result.isValid) {
        toast({
          title: "Congratulations!",
          description: "All equations are correct!",
        });
      } else {
        toast({
          title: "Not quite right",
          description: "Some equations need to be corrected.",
          variant: "destructive",
        });
      }
    }
  };

  const handleStartGame = () => {
    setGameStarted(true);
    start();
    toast({
      title: "Game started!",
      description: "Timer is now running. Good luck!",
    });
  };

  const handleGetHint = () => {
    getHint();
    toast({
      title: "Hint provided",
      description: "One cell has been filled for you.",
    });
  };

  const handleReset = () => {
    resetGame();
    reset();
    setShowSuccessModal(false);
    toast({
      title: "Game reset",
      description: "The puzzle has been reset to its initial state.",
    });
  };

  const handleNewGame = () => {
    handleReset();
    setShowSuccessModal(false);
  };

  const handleDifficultyChange = (newDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(newDifficulty);
    // The useGameLogic hook will automatically fetch a new puzzle when difficulty changes
  };

  const equationStatus = getEquationStatus();
  const completedEquations = [
    ...equationStatus.horizontal,
    ...equationStatus.vertical
  ].filter(eq => eq.isValid).length;
  const totalEquations = equationStatus.horizontal.length + equationStatus.vertical.length;

  const defaultStats = {
    totalSolved: stats?.totalSolved || 0,
    bestTime: stats?.bestTime ? `${Math.floor(stats.bestTime / 60).toString().padStart(2, '0')}:${(stats.bestTime % 60).toString().padStart(2, '0')}` : '00:00',
    averageTime: stats?.averageTime ? `${Math.floor(stats.averageTime / 60).toString().padStart(2, '0')}:${(stats.averageTime % 60).toString().padStart(2, '0')}` : '00:00',
    hintsUsed: gameState.hintsUsed,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading puzzle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <GameHeader
        formattedTime={formattedTime}
        onSettingsClick={() => setShowSettingsModal(true)}
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <MathGrid
              grid={gameState.grid}
              onCellChange={updateCell}
              equationStatus={equationStatus}
              completedEquations={completedEquations}
              totalEquations={totalEquations}
            />
            
            <GameControls
              onCheckSolution={handleCheckSolution}
              onGetHint={handleGetHint}
              onReset={handleReset}
              isValidating={isValidating}
            />
          </div>

          <GameSidebar
            stats={defaultStats}
          />
        </div>
      </main>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onNewGame={handleNewGame}
        completionTime={formattedTime}
        hintsUsed={gameState.hintsUsed}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onDifficultyChange={handleDifficultyChange}
        difficulty={difficulty}
      />
    </div>
  );
}
