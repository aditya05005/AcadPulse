import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Moon, Sun, BarChart3, UserCircle2, LogIn, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <BarChart3 className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Academic Health Scorecard
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-6 md:flex">
              {/* Profile button — left of Home */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <UserCircle2 className="h-4 w-4 text-accent" />
                  <span className="max-w-[100px] truncate text-xs font-medium">
                    {user ? user.username : 'Account'}
                  </span>
                  <ChevronDown className={'h-3.5 w-3.5 text-muted-foreground transition-transform ' + (profileOpen ? 'rotate-180' : '')} />
                </button>

                {profileOpen && (
                  <div className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-border bg-card shadow-xl">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-xs text-muted-foreground">Signed in as</p>
                      <p className="mt-0.5 truncate text-sm font-semibold">
                        {user ? user.username : 'Not signed in'}
                      </p>
                    </div>
                    <div className="p-1.5">
                      {user ? (
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      ) : (
                        <Link
                          to="/signin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                        >
                          <LogIn className="h-4 w-4" />
                          Sign In
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/" className={'text-sm transition-colors ' + (isActive('/') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                Home
              </Link>
              <Link to="/dashboard" className={'text-sm transition-colors ' + (isActive('/dashboard') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                Dashboard
              </Link>
              <Link to="/courses" className={'text-sm transition-colors ' + (isActive('/courses') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                Courses
              </Link>
              <Link to="/predict" className={'text-sm transition-colors ' + (isActive('/predict') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                Prediction Tool
              </Link>
              <Link to="/insights" className={'text-sm transition-colors ' + (isActive('/insights') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                Insights
              </Link>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
