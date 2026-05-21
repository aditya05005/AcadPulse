import { Link } from 'react-router';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-8xl font-semibold text-accent">404</h1>
        <p className="mt-4 text-xl text-muted-foreground">Page not found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-all hover:opacity-90"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
