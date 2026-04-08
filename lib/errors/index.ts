export { ERROR_MESSAGES, type ErrorMessageKey } from './messages';

/**
 * Benutzerdefinierte Fehlerklasse für die Anwendung
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Extrahiert eine benutzerfreundliche Fehlermeldung
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Ein unbekannter Fehler ist aufgetreten.';
}
