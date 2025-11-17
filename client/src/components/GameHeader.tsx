import { Settings, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { MathCrosswordLogo } from '@/components/ui/MathCrosswordLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
            <div className="bg-primary text-primary-foreground rounded-lg p-2.5">
              <MathCrosswordLogo size={28} />
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

            {/* User Menu */}
            <UserMenu />

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

function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/login'}
        >
          Sign In
        </Button>
        <Button
          size="sm"
          onClick={() => window.location.href = '/register'}
        >
          Register
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span>{user?.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="h-4 w-4 mr-2" />
          Profile (Coming Soon)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
