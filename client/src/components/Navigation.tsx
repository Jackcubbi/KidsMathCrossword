import type { User } from "@shared/schema";

interface NavigationProps {
  user: User;
}

export default function Navigation({ user }: NavigationProps) {
  return (
    <nav className="bg-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="text-primary-foreground text-lg font-bold">
            <i className="fas fa-puzzle-piece mr-2"></i>Math Crosswords
          </div>
          <div className="text-primary-foreground text-sm">
            <span data-testid="text-username">{user.firstName || "User"}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
