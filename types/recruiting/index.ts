export type EmpfehlungStatus = "offen" | "eingestellt" | "probezeit_bestanden" | "ausgezahlt";

export interface Stelle {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Empfehlung {
  id: string;
  empfehler_name: string;
  empfehler_email: string;
  kandidat_name: string;
  kandidat_kontakt: string | null;
  stelle_id: string;
  position: string | null;
  ref_code: string;
  status: EmpfehlungStatus;
  praemie_betrag: number | null;
  ausgezahlt_am: string | null;
  iban: string | null;
  bic: string | null;
  kontoinhaber: string | null;
  bank_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmpfehlungWithStelle extends Empfehlung {
  stelle: Pick<Stelle, "id" | "title"> | null;
}

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

export interface DashboardStats {
  offen: number;
  eingestellt: number;
  probezeit_bestanden: number;
  total_praemie: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface AppSettings {
  praemie_betrag_default: number;
}
