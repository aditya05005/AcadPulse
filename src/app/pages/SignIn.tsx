import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BarChart3, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SignIn() {
  const { signIn, signUp, requestPasswordReset, updatePassword, recovering } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async () => {
    setError('');
    setInfo('');

    if (recovering) {
      if (!password.trim()) {
        setError('Please enter a new password.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        await updatePassword(password);
        setInfo('Password updated. You can now sign in with your new password.');
        setPassword('');
        setConfirmPassword('');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Something went wrong.';
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (tab === 'signup' && !username.trim()) {
      setError('Please enter a username.');
      return;
    }

    setLoading(true);

    try {
      if (tab === 'signin') {
        await signIn(email.trim(), password);
        navigate('/dashboard');
      } else {
        await signUp(email.trim(), password, username.trim());
        setInfo('Account created! Check your email to confirm before signing in.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      if (msg === 'Username is taken.') {
        window.alert(msg);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');

    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setInfo('Password reset email sent. Open the link in your inbox to set a new password.');
      setShowForgotPassword(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <BarChart3 className="h-6 w-6 text-accent-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">
              {recovering ? 'Reset password' : tab === 'signin' ? 'Sign in' : 'Create account'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              AcadPulse
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* Tab switcher */}
          {!recovering && (
            <div className="mb-6 flex rounded-lg border border-border bg-muted/30 p-1">
              <button
                onClick={() => { setTab('signin'); setShowForgotPassword(false); setError(''); setInfo(''); }}
                className={'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ' +
                  (tab === 'signin' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                Sign In
              </button>
              <button
                onClick={() => { setTab('signup'); setShowForgotPassword(false); setError(''); setInfo(''); }}
                className={'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ' +
                  (tab === 'signup' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                Sign Up
              </button>
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            {!recovering && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none"
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
            )}

            {/* Username — sign up only */}
            {!recovering && tab === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none"
                  placeholder="Choose a display name"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">{recovering ? 'New Password' : 'Password'}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 pr-10 text-sm transition-colors focus:border-accent focus:outline-none"
                  placeholder={recovering || tab === 'signup' ? 'Min. 6 characters' : 'Enter your password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {recovering && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Confirm New Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none"
                  placeholder="Re-enter your new password"
                />
              </div>
            )}

            {!recovering && tab === 'signin' && (
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword((prev) => !prev);
                    setError('');
                    setInfo('');
                  }}
                  className="text-accent transition-opacity hover:opacity-80"
                >
                  Forgot password?
                </button>
                {showForgotPassword && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="font-medium text-foreground transition-opacity hover:opacity-80 disabled:opacity-50"
                  >
                    Send reset email
                  </button>
                )}
              </div>
            )}

            {showForgotPassword && !recovering && tab === 'signin' && (
              <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Enter your email above, then use “Send reset email”.
              </p>
            )}

            {/* Error */}
            {error && (
              <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}

            {/* Info (e.g. confirm email) */}
            {info && (
              <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                {info}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {recovering ? 'Update Password' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
