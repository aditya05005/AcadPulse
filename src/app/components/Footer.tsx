import { Link } from 'react-router';
import { BarChart3 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <BarChart3 className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight">
                AcadPulse
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              A focused academic dashboard for tracking courses, attendance, study time, and reminders.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Built and maintained by <span className="font-medium text-foreground">Aditya</span>.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold">Navigation</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Home
                </Link>
              </li>
              <li>
                <a href="/#about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  About
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/aditya05005"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            © 2026 AcadPulse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
