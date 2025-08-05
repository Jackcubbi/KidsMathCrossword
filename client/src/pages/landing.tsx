import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const handleLogin = async () => {
    try {
      // In development mode, make a POST request to establish session
      await apiRequest("POST", "/login");

      // Invalidate auth queries to refetch user data
      await queryClient.invalidateQueries({ queryKey: ["/auth/user"] });

      // Reload to trigger React Router to show home page
      window.location.reload();
    } catch (error) {
      console.error("Login error:", error);
    }
  };  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-2xl shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                <i className="fas fa-puzzle-piece text-4xl text-primary"></i>
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-4">
                Math Crossword App
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Learn math through fun and engaging crossword puzzles!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-brain text-2xl text-accent"></i>
                </div>
                <h3 className="font-semibold mb-2">Learn & Practice</h3>
                <p className="text-sm text-muted-foreground">
                  Improve your math skills with interactive puzzles
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-secondary/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-trophy text-2xl text-secondary"></i>
                </div>
                <h3 className="font-semibold mb-2">Track Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your improvements with detailed statistics
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-cog text-2xl text-primary"></i>
                </div>
                <h3 className="font-semibold mb-2">Customize</h3>
                <p className="text-sm text-muted-foreground">
                  Adjust difficulty and operations to your level
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full md:w-auto px-8 py-4 text-lg font-bold"
              onClick={handleLogin}
              data-testid="button-login"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Get Started
            </Button>

            <p className="text-sm text-muted-foreground mt-6">
              Sign in to start solving math crosswords and track your progress!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
