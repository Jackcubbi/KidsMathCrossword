import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";

interface NavigationProps {
  user: User;
}

export default function Navigation({ user }: NavigationProps) {
  return (
    <nav className="bg-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="text-primary-foreground text-sm">
              <span data-testid="text-username">{user.firstName || "User"}</span>
            </div>
            <Button
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={() => window.location.href = '/logout'}
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
