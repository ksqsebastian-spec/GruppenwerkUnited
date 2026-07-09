export const STORAGE_BUCKET = 'customer-dateien';
export const PROMPT_VORLAGEN_BUCKET = 'prompt-vorlagen';

/**
 * Macht aus einem Dateinamen einen storage-tauglichen Pfad-Bestandteil:
 * Umlaute ersetzt, alle Sonderzeichen auf "_" reduziert, Mehrfach-"_" zusammen­
 * gefasst. Die Originalbezeichnung wird separat (in der DB als `dateiname`)
 * gespeichert und beim Download zurückgegeben — der Nutzer bekommt seinen
 * Namen also zurück.
 */
export function sanitizeFilenameForPath(name: string): string {
  return (
    name
      .replace(/ä/gi, 'ae')
      .replace(/ö/gi, 'oe')
      .replace(/ü/gi, 'ue')
      .replace(/ß/g, 'ss')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // Akzente nach NFD entfernen
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || 'datei'
  );
}
