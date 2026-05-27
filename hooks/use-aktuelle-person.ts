'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';

const KEY_PREFIX = 'werkbank_aktuelle_person_';

/**
 * Verwaltet die aktuell ausgewählte Person ("Wer bin ich?") je Firma.
 * Da der Login nur die Firma kennt, wird die Person-Auswahl pro Firma
 * im Browser (localStorage) gespeichert und treibt den "Für mich"-Filter.
 */
export function useAktuellePerson(): [string | null, (personId: string | null) => void] {
  const { company } = useAuth();
  const storageKey = company?.companyId ? `${KEY_PREFIX}${company.companyId}` : null;
  const [personId, setPersonId] = useState<string | null>(null);

  useEffect(() => {
    if (!storageKey) return;
    setPersonId(localStorage.getItem(storageKey));
  }, [storageKey]);

  const setze = useCallback(
    (id: string | null): void => {
      if (!storageKey) return;
      if (id) {
        localStorage.setItem(storageKey, id);
      } else {
        localStorage.removeItem(storageKey);
      }
      setPersonId(id);
    },
    [storageKey],
  );

  return [personId, setze];
}
