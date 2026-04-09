'use client';

import { createContext, useContext, useState, useEffect } from 'react';

/** Firmen-Kontext aus der Session */
export interface CompanyInfo {
  companyId: string;
  companyName: string;
  isAdmin: boolean;
  /** Erlaubte Modul-IDs oder '*' für vollen Zugriff */
  allowedModules: string[] | '*';
}

interface SimpleUser {
  email: string;
}

interface AuthContextType {
  user: SimpleUser;
  company: CompanyInfo | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FALLBACK_USER: SimpleUser = { email: 'Werkbank' };

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Firmen-Kontext aus Session laden
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{
          companyId: string;
          companyName: string;
          isAdmin: boolean;
          modules: string[] | '*';
        }>;
      })
      .then((data) => {
        if (data) {
          setCompany({
            companyId: data.companyId,
            companyName: data.companyName,
            isAdmin: data.isAdmin,
            allowedModules: data.modules,
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const signOut = async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user: FALLBACK_USER, company, isLoading, signOut }}>
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
