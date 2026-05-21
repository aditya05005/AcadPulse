import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User } from '../../lib/types';
import { signIn as dbSignIn, signUp as dbSignUp, signOut as dbSignOut, getCurrentUser } from '../../lib/db';
import { supabase } from '../../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Guard reference to prevent stale closures and concurrent profile queries
  const userRef = useRef<User | null>(null);

  const updateUserState = (u: User | null) => {
    userRef.current = u;
    setUser(u);
  };

  useEffect(() => {
    let isMounted = true;

    // 1. One-time clean check on app boot
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await getCurrentUser();
          if (isMounted && profile) {
            updateUserState(profile);
          }
        }
      } catch (err) {
        console.error('Error initializing auth on boot:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // 2. Clear background event subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth Event Fired:', event);

        if (event === 'SIGNED_IN') {
          // Only auto-fetch if the profile wasn't already populated by explicit login
          if (!userRef.current && session?.user) {
            const profile = await getCurrentUser();
            if (profile) updateUserState(profile);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          updateUserState(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Tab focus trigger: If we are already logged in, ignore completely!
          if (!userRef.current && session?.user) {
            const profile = await getCurrentUser();
            if (profile) updateUserState(profile);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('1. Initiating manual sign in...');
      const u = await dbSignIn(email, password);
      updateUserState(u);
      console.log('2. Sign in successful, state updated.');
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const u = await dbSignUp(email, password, username);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        updateUserState(u);
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    await dbSignOut();
    updateUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
