'use client';

import { createContext, useContext } from 'react';

/**
 * Vereinfachter Auth-Kontext — Authentifizierung läuft über Middleware (Cookie).
 * Wenn der Benutzer diese Komponente erreicht, ist er bereits eingeloggt.
 */

interface SimpleUser {
  email: string;
}

interface AuthContextType {
  user: SimpleUser;
  isLoading: false;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

const WERKBANK_USER: SimpleUser = { email: 'Werkbank' };

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const signOut = async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user: WERKBANK_USER, isLoading: false, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden');
  }
  return context;
}
