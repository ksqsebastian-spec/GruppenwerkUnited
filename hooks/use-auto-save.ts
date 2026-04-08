import { useEffect, useRef } from 'react';

interface UseAutoSaveOptions<T> {
  /** Eindeutiger Schlüssel für LocalStorage */
  key: string;
  /** Aktuelle Formulardaten */
  data: T;
  /** Callback wenn gespeicherte Daten wiederhergestellt werden */
  onRestore?: (data: T) => void;
  /** Intervall in Millisekunden (Standard: 10000 = 10 Sekunden) */
  interval?: number;
}

/**
 * Hook für automatisches Speichern von Formulardaten im LocalStorage
 * Stellt Daten wieder her, wenn der Browser abstürzt oder die Seite neu geladen wird
 */
export function useAutoSave<T>({
  key,
  data,
  onRestore,
  interval = 10000,
}: UseAutoSaveOptions<T>): { clear: () => void } {
  const storageKey = `autosave_${key}`;
  const hasRestored = useRef(false);

  // Beim ersten Laden: Gespeicherte Daten wiederherstellen
  useEffect(() => {
    if (hasRestored.current) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && onRestore) {
        const parsed = JSON.parse(saved) as T;
        onRestore(parsed);
      }
    } catch (error) {
      console.error('Fehler beim Wiederherstellen der Formulardaten:', error);
    }

    hasRestored.current = true;
  }, [storageKey, onRestore]);

  // Regelmäßig speichern
  useEffect(() => {
    const saveData = (): void => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.error('Fehler beim Auto-Speichern:', error);
      }
    };

    // Initial speichern
    saveData();

    // Intervall für regelmäßiges Speichern
    const intervalId = setInterval(saveData, interval);

    // Vor dem Verlassen der Seite speichern
    const handleBeforeUnload = (): void => {
      saveData();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [data, storageKey, interval]);

  // Funktion zum Löschen der gespeicherten Daten (nach erfolgreichem Submit)
  const clear = (): void => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Fehler beim Löschen der Auto-Save-Daten:', error);
    }
  };

  return { clear };
}
