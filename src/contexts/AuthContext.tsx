import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { LocalSession, LocalUser } from '../lib/database.types';
import { localDb, subscribeLocalDb } from '../lib/localDatabase';

interface AuthContextValue {
  user: LocalUser | null;
  session: LocalSession | null;
  loading: boolean;
  role: 'patient' | 'caretaker';
  setRole: (r: 'patient' | 'caretaker') => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'patient' | 'caretaker'>('patient');

  useEffect(() => {
    const loadSession = () => {
      const nextSession = localDb.getSession();
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    };

    loadSession();

    return subscribeLocalDb(loadSession);
  }, []);

  const signIn = async (email: string, password: string) => {
    const nextSession = localDb.signIn(email, password);
    setSession(nextSession);
    setUser(nextSession.user);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const nextSession = localDb.signUp(email, password, name);
    setSession(nextSession);
    setUser(nextSession.user);
  };

  const signOut = async () => {
    localDb.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, setRole, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
