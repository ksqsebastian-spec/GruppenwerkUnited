/**
 * Gemeinsame TypeScript-Typen für alle Module.
 *
 * Diese Typen sind modul-unabhängig und werden von Recruiting,
 * Affiliate und zukünftigen Modulen verwendet.
 */

// ---------------------------------------------------------------------------
// API-Antwortstrukturen
// ---------------------------------------------------------------------------

/** Paginierte Listen-Antwort – einheitliches Format für alle Listen-Endpoints */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Standard-Fehlerantwort von API-Routen */
export interface ApiErrorResponse {
  error: string;
}

/** Standard-Erfolgsmeldung ohne Rückgabewert */
export interface ApiSuccessResponse {
  success: true;
}

// ---------------------------------------------------------------------------
// Audit-Log
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Gemeinsame Entitäten
// ---------------------------------------------------------------------------

/** Empfehler-Daten – gleiche Struktur in Recruiting und Affiliate */
export interface EmpfehlerBase {
  empfehler_name: string;
  empfehler_email: string;
  ref_code?: string;
}

/** Basis-Paginierungsparameter für Query-Strings */
export interface PaginationParams {
  page: number;
  pageSize: number;
}
