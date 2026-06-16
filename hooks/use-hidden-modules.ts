'use client';

import { useEffect, useState } from 'react';

const HIDDEN_MODULES_KEY = 'werkbank_hidden_modules';
const EVENT_NAME = 'werkbank:hidden-modules-changed';

function read(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(HIDDEN_MODULES_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Geteilter Zustand der vom Nutzer ausgeblendeten Module.
 *
 * Persistiert in localStorage und synchron über alle Verwender (Dashboard +
 * Sidebar) gehalten: ein Toggle dispatcht ein Custom-Event, auf das alle
 * Instanzen lauschen — so verschwindet ein ausgeblendetes Modul sofort auch
 * aus der Seitenleiste. `storage`-Events decken zusätzlich andere Tabs ab.
 */
export function useHiddenModules(): [Set<string>, (id: string) => void] {
  const [hidden, setHidden] = useState<Set<string>>(() => read());

  useEffect(() => {
    const sync = (): void => setHidden(read());
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggle = (id: string): void => {
    const next = read();
    if (next.has(id)) next.delete(id);
    else next.add(id);
    localStorage.setItem(HIDDEN_MODULES_KEY, JSON.stringify([...next]));
    setHidden(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  return [hidden, toggle];
}
