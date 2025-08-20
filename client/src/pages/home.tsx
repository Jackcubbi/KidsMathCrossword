import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import CrosswordGrid from "@/components/CrosswordGrid";
import Timer from "@/components/Timer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportToPDF } from "@/lib/pdfExport";
import type { CrosswordData, UserStats, CrosswordHistory, UserSettings } from "@/types/crossword";

export default function Home() {
  const { toast } = useToast();
  const [currentCrossword, setCurrentCrossword] = useState<CrosswordData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [completionData, setCompletionData] = useState<{ score: number; time: number } | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // No authentication required - public access

  // Fetch user stats
  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/user/stats"],
  });

  // Fetch user history
  const { data: history } = useQuery<CrosswordHistory[]>({
    queryKey: ["/user/history"],
    enabled: activeTab === "history",
  });

  // Fetch user settings
  const { data: settings } = useQuery<UserSettings>({
    queryKey: ["/user/settings"],
    enabled: activeTab === "settings",
  });

  // Generate new crossword
  const generateCrosswordMutation = useMutation({
    mutationFn: async (params?: { gridSize?: number }) => {
      const response = await apiRequest("POST", "/crosswords/generate", params);
      return response.json();
    },
    onSuccess: (crossword) => {
      setCurrentCrossword(crossword);
      setIsPlaying(true);
      setElapsedTime(0);
      setActiveTab("solve");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate crossword",
        variant: "destructive",
      });
    },
  });

  // Complete crossword
  const completeCrosswordMutation = useMutation({
    mutationFn: async ({ crosswordId, timeSpent, score }: { crosswordId: string; timeSpent: number; score: number }) => {
      const response = await apiRequest("POST", `/crosswords/${crosswordId}/complete`, { timeSpent, score });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/user/history"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save completion",
        variant: "destructive",
      });
    },
  });

  // Update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const response = await apiRequest("PATCH", "/user/settings", settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/user/settings"] });
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const calculateScore = (timeInSeconds: number): number => {
    const minutes = timeInSeconds / 60;
    if (minutes < 2) return 100;
    if (minutes < 3) return 90;
    if (minutes < 4) return 80;
    if (minutes < 5) return 70;
    if (minutes < 6) return 60;
    if (minutes < 7) return 50;
    if (minutes < 8) return 40;
    if (minutes < 9) return 30;
    if (minutes < 10) return 20;
    return 10;
  };

  const handleCrosswordComplete = () => {
    if (!currentCrossword || !isPlaying) return;

    setIsPlaying(false);
    const score = calculateScore(elapsedTime);
    setCompletionData({ score, time: elapsedTime });
    setShowResultModal(true);

    // Save completion to database
    completeCrosswordMutation.mutate({
      crosswordId: currentCrossword.id,
      timeSpent: elapsedTime,
      score,
    });
  };

  const handleExportPDF = () => {
    if (!currentCrossword) return;
    exportToPDF(currentCrossword, "Public User");
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={{ firstName: 'Public', lastName: 'User', email: 'public@example.com' }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Math Crossword Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Ready to solve some puzzles?</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <i className="fas fa-home mr-2"></i>Dashboard
            </TabsTrigger>
            <TabsTrigger value="solve" data-testid="tab-solve">
              <i className="fas fa-play mr-2"></i>Solve
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <i className="fas fa-history mr-2"></i>History
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <i className="fas fa-cog mr-2"></i>Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold gradient-text mb-4">
                Welcome to Math Crosswords! 🎯
              </h1>
              <p className="text-lg text-muted-foreground">Ready to solve some fun math puzzles?</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-xl transition-shadow" data-testid="card-puzzles-solved">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Puzzles Solved</p>
                      <p className="text-3xl font-bold text-primary">{stats?.puzzlesSolved || 0}</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <i className="fas fa-check-circle text-primary text-xl"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow" data-testid="card-best-score">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Best Score</p>
                      <p className="text-3xl font-bold text-secondary">{stats?.bestScore || 0}</p>
                    </div>
                    <div className="bg-secondary/10 p-3 rounded-lg">
                      <i className="fas fa-trophy text-secondary text-xl"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow" data-testid="card-best-time">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Best Time</p>
                      <p className="text-3xl font-bold text-accent">
                        {stats?.bestTime ? formatTime(stats.bestTime) : "0:00"}
                      </p>
                    </div>
                    <div className="bg-accent/10 p-3 rounded-lg">
                      <i className="fas fa-stopwatch text-accent text-xl"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow" data-testid="card-total-points">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                      <p className="text-3xl font-bold text-purple-500">{stats?.totalPoints || 0}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <i className="fas fa-star text-purple-500 text-xl"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Button
                className="h-auto p-6 bg-primary text-primary-foreground hover:bg-primary/90 group"
                onClick={() => generateCrosswordMutation.mutate()}
                disabled={generateCrosswordMutation.isPending}
                data-testid="button-start-puzzle"
              >
                <div className="text-center">
                  <i className="fas fa-play text-4xl mb-4 group-hover:animate-bounce-gentle"></i>
                  <h3 className="text-xl font-bold mb-2">Start New Puzzle</h3>
                  <p className="text-primary-foreground/80">Begin a fresh math crossword</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-6 bg-accent text-accent-foreground hover:bg-accent/90 group"
                onClick={() => setActiveTab("history")}
                data-testid="button-view-history"
              >
                <div className="text-center">
                  <i className="fas fa-history text-4xl mb-4 group-hover:animate-bounce-gentle"></i>
                  <h3 className="text-xl font-bold mb-2">View History</h3>
                  <p className="text-accent-foreground/80">See your past achievements</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-6 bg-secondary text-secondary-foreground hover:bg-secondary/90 group"
                onClick={() => setActiveTab("settings")}
                data-testid="button-open-settings"
              >
                <div className="text-center">
                  <i className="fas fa-cog text-4xl mb-4 group-hover:animate-bounce-gentle"></i>
                  <h3 className="text-xl font-bold mb-2">Settings</h3>
                  <p className="text-secondary-foreground/80">Customize your puzzles</p>
                </div>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="solve" className="space-y-6">
            {currentCrossword ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                      <CardTitle className="text-2xl mb-2">{currentCrossword.title}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span><i className="fas fa-th mr-1"></i>Grid: {currentCrossword.gridSize}×{currentCrossword.gridSize}</span>
                        <span><i className="fas fa-calculator mr-1"></i>Operations: {currentCrossword.operations.join(' ')}</span>
                        <span><i className="fas fa-hashtag mr-1"></i>Range: {currentCrossword.numberRange.min}-{currentCrossword.numberRange.max}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <Timer
                        isRunning={isPlaying}
                        onTimeUpdate={setElapsedTime}
                        data-testid="timer-display"
                      />
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">SCORE</p>
                          <p className="text-xl font-bold text-secondary" data-testid="text-current-score">
                            {isPlaying ? calculateScore(elapsedTime) : 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex justify-center mb-6">
                    <CrosswordGrid
                      crossword={currentCrossword}
                      onComplete={handleCrosswordComplete}
                      disabled={!isPlaying}
                      data-testid="crossword-grid"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <Button
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={() => {
                        // Check answers logic handled in CrosswordGrid
                      }}
                      disabled={!isPlaying}
                      data-testid="button-check-answers"
                    >
                      <i className="fas fa-check mr-2"></i>Check Answers
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsPlaying(false);
                        setElapsedTime(0);
                        // Reset crossword state
                      }}
                      data-testid="button-reset-puzzle"
                    >
                      <i className="fas fa-redo mr-2"></i>Reset
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleExportPDF}
                      data-testid="button-export-pdf"
                    >
                      <i className="fas fa-file-pdf mr-2"></i>Export PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                    <i className="fas fa-puzzle-piece text-3xl text-muted-foreground"></i>
                  </div>
                  <h3 className="text-xl font-bold mb-4">No Active Puzzle</h3>
                  <p className="text-muted-foreground mb-6">Start a new crossword puzzle to begin solving!</p>
                  <Button
                    onClick={() => generateCrosswordMutation.mutate()}
                    disabled={generateCrosswordMutation.isPending}
                    data-testid="button-generate-puzzle"
                  >
                    <i className="fas fa-play mr-2"></i>Generate New Puzzle
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    <i className="fas fa-history mr-2 text-primary"></i>Puzzle History
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                {history && history.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="table-history">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {history.map((record, index) => (
                          <tr key={record.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-history-${index}`}>
                            <td className="py-4 px-4">
                              <div className="text-sm">
                                <p className="font-medium text-foreground">
                                  {new Date(record.completedAt).toLocaleDateString()}
                                </p>
                                <p className="text-muted-foreground">
                                  {new Date(record.completedAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-mono text-lg">{formatTime(record.timeSpent)}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-xl font-bold text-secondary">{record.score}</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <i
                                      key={i}
                                      className={`fas fa-star text-sm ${
                                        i < Math.floor(record.score / 20) ? 'text-secondary' : 'text-muted-foreground'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                      <i className="fas fa-history text-2xl text-muted-foreground"></i>
                    </div>
                    <h3 className="font-semibold mb-2">No History Yet</h3>
                    <p className="text-muted-foreground mb-4">Complete your first puzzle to see your history here!</p>
                    <Button onClick={() => setActiveTab("solve")} data-testid="button-start-first-puzzle">
                      <i className="fas fa-play mr-2"></i>Start Your First Puzzle
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <i className="fas fa-cog mr-2 text-primary"></i>Puzzle Settings
                </CardTitle>
              </CardHeader>

              <CardContent>
                {settings && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-foreground">Grid Configuration</h3>

                      <div>
                        <Label className="text-sm font-medium text-foreground mb-3">Default Grid Size</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[5, 7, 10, 12].map((size) => (
                            <Button
                              key={size}
                              variant={settings.defaultGridSize === size ? "default" : "outline"}
                              className="p-3"
                              onClick={() => updateSettingsMutation.mutate({ defaultGridSize: size })}
                              data-testid={`button-grid-${size}`}
                            >
                              <div className="text-center">
                                <span className="font-medium">{size}×{size}</span>
                                <p className="text-xs">
                                  {size === 5 ? "Beginner" : size === 7 ? "Easy" : size === 10 ? "Medium" : "Hard"}
                                </p>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-foreground mb-3">Number Range</Label>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center space-x-4">
                            <Label className="text-sm text-muted-foreground w-16">From:</Label>
                            <Input
                              type="number"
                              value={settings.numberRange.min}
                              onChange={(e) => updateSettingsMutation.mutate({
                                numberRange: { ...settings.numberRange, min: parseInt(e.target.value) }
                              })}
                              className="flex-1"
                              data-testid="input-range-min"
                            />
                          </div>
                          <div className="flex items-center space-x-4">
                            <Label className="text-sm text-muted-foreground w-16">To:</Label>
                            <Input
                              type="number"
                              value={settings.numberRange.max}
                              onChange={(e) => updateSettingsMutation.mutate({
                                numberRange: { ...settings.numberRange, max: parseInt(e.target.value) }
                              })}
                              className="flex-1"
                              data-testid="input-range-max"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-foreground">Mathematical Operations</h3>

                      <div className="space-y-3">
                        {[
                          { op: '+', label: 'Addition (+)', color: 'text-primary' },
                          { op: '-', label: 'Subtraction (−)', color: 'text-accent' },
                          { op: '×', label: 'Multiplication (×)', color: 'text-secondary' },
                          { op: '÷', label: 'Division (÷)', color: 'text-purple-500' },
                        ].map(({ op, label, color }) => (
                          <div key={op} className="flex items-center space-x-3">
                            <Checkbox
                              checked={settings.operations.includes(op)}
                              onCheckedChange={(checked) => {
                                const newOps = checked
                                  ? [...settings.operations, op]
                                  : settings.operations.filter(o => o !== op);
                                updateSettingsMutation.mutate({ operations: newOps });
                              }}
                              data-testid={`checkbox-operation-${op}`}
                            />
                            <span className="font-medium">{label}</span>
                            <span className={`text-2xl ${color}`}>{op}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Result Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="mb-6">
                <i className="fas fa-trophy text-6xl text-secondary mb-4"></i>
                <h3 className="text-2xl font-bold text-foreground mb-2">Puzzle Completed! 🎉</h3>
                <p className="text-muted-foreground">Congratulations on solving the puzzle!</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {completionData && (
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-bold text-lg" data-testid="text-completion-time">
                  {formatTime(completionData.time)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Score:</span>
                <span className="font-bold text-lg text-secondary" data-testid="text-completion-score">
                  {completionData.score} points
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Rating:</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star ${
                        i < Math.floor(completionData.score / 20) ? 'text-secondary' : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              className="flex-1"
              onClick={() => {
                setShowResultModal(false);
                generateCrosswordMutation.mutate();
              }}
              data-testid="button-play-again"
            >
              Play Again
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                handleExportPDF();
                setShowResultModal(false);
              }}
              data-testid="button-export-completion-pdf"
            >
              Export PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
