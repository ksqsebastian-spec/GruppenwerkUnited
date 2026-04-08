/**
 * Konstanten für die Fuhrpark Management App
 */

// Kraftstoffarten
export const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'benzin', label: 'Benzin' },
  { value: 'elektro', label: 'Elektro' },
  { value: 'hybrid_benzin', label: 'Hybrid (Benzin)' },
  { value: 'hybrid_diesel', label: 'Hybrid (Diesel)' },
  { value: 'gas', label: 'Gas' },
] as const;

// Fahrzeugstatus
export const VEHICLE_STATUS = [
  { value: 'active', label: 'Aktiv' },
  { value: 'archived', label: 'Archiviert' },
] as const;

// Schadensstatus
export const DAMAGE_STATUS = [
  { value: 'reported', label: 'Gemeldet' },
  { value: 'approved', label: 'Freigegeben' },
  { value: 'in_repair', label: 'In Reparatur' },
  { value: 'completed', label: 'Abgeschlossen' },
] as const;

// Terminstatus
export const APPOINTMENT_STATUS = [
  { value: 'pending', label: 'Ausstehend' },
  { value: 'completed', label: 'Erledigt' },
  { value: 'overdue', label: 'Überfällig' },
] as const;

// Führerscheinkontrolle - Status
export const LICENSE_CHECK_STATUS = [
  { value: 'overdue', label: 'Überfällig', color: 'destructive', bgClass: 'bg-red-100 text-red-800' },
  { value: 'due_soon', label: 'Bald fällig', color: 'warning', bgClass: 'bg-orange-100 text-orange-800' },
  { value: 'ok', label: 'In Ordnung', color: 'success', bgClass: 'bg-green-100 text-green-800' },
] as const;

// Führerscheinkontrolle - Mitarbeiter-Status
export const LICENSE_EMPLOYEE_STATUS = [
  { value: 'active', label: 'Aktiv' },
  { value: 'archived', label: 'Archiviert' },
] as const;

// Führerscheinklassen
export const LICENSE_CLASSES = [
  { value: 'AM', label: 'AM - Mopeds/Quads' },
  { value: 'A1', label: 'A1 - Leichtkrafträder' },
  { value: 'A2', label: 'A2 - Krafträder bis 35kW' },
  { value: 'A', label: 'A - Krafträder' },
  { value: 'B', label: 'B - PKW bis 3,5t' },
  { value: 'BE', label: 'BE - PKW mit Anhänger' },
  { value: 'B96', label: 'B96 - PKW mit schwerem Anhänger' },
  { value: 'C1', label: 'C1 - LKW bis 7,5t' },
  { value: 'C1E', label: 'C1E - LKW bis 7,5t mit Anhänger' },
  { value: 'C', label: 'C - LKW über 3,5t' },
  { value: 'CE', label: 'CE - LKW mit Anhänger' },
  { value: 'D1', label: 'D1 - Kleinbusse' },
  { value: 'D1E', label: 'D1E - Kleinbusse mit Anhänger' },
  { value: 'D', label: 'D - Busse' },
  { value: 'DE', label: 'DE - Busse mit Anhänger' },
  { value: 'T', label: 'T - Land- und Forstwirtschaft' },
  { value: 'L', label: 'L - Zugmaschinen' },
] as const;

// Standard-Dokumenttypen
export const DEFAULT_DOCUMENT_TYPES = [
  'Fahrzeugschein',
  'Versicherungspolice',
  'Leasingvertrag',
  'TÜV-Bericht',
  'Inspektionsbericht',
  'Rechnung',
  'Sonstiges',
] as const;

// Standard-Termintypen
export const DEFAULT_APPOINTMENT_TYPES = [
  { name: 'TÜV/HU', intervalMonths: 24, color: '#EF4444' },
  { name: 'Inspektion', intervalMonths: 12, color: '#3B82F6' },
  { name: 'Versicherung', intervalMonths: 12, color: '#10B981' },
  { name: 'Leasingende', intervalMonths: null, color: '#F97316' },
  { name: 'Reifenwechsel', intervalMonths: 6, color: '#6B7280' },
  { name: 'Sonstiges', intervalMonths: null, color: '#8B5CF6' },
] as const;

// Standard-Schadensarten
export const DEFAULT_DAMAGE_TYPES = [
  'Unfall (selbstverschuldet)',
  'Unfall (fremdverschuldet)',
  'Vandalismus',
  'Parkschaden',
  'Steinschlag',
  'Verschleiß',
  'Sonstiges',
] as const;

// Standard-Kostenarten
export const DEFAULT_COST_TYPES = [
  { name: 'Tanken', icon: 'fuel' },
  { name: 'Inspektion/Wartung', icon: 'wrench' },
  { name: 'Reparatur', icon: 'tool' },
  { name: 'Reifen', icon: 'circle' },
  { name: 'Versicherung', icon: 'shield' },
  { name: 'Steuer/Abgaben', icon: 'receipt' },
  { name: 'Waschen/Pflege', icon: 'droplet' },
  { name: 'Parkgebühren', icon: 'parking' },
  { name: 'Sonstiges', icon: 'more-horizontal' },
] as const;

// Datei-Upload Einschränkungen
export const FILE_UPLOAD = {
  maxSizeBytes: 10 * 1024 * 1024, // 10 MB
  maxSizeMB: 10,
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
  allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
} as const;

// Pagination
export const PAGINATION = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

// Cache-Zeiten für TanStack Query (in Millisekunden)
export const QUERY_STALE_TIMES = {
  companies: 30 * 60 * 1000, // 30 Minuten
  vehicles: 5 * 60 * 1000, // 5 Minuten
  drivers: 5 * 60 * 1000, // 5 Minuten
  appointments: 2 * 60 * 1000, // 2 Minuten
  damages: 2 * 60 * 1000, // 2 Minuten
  costs: 5 * 60 * 1000, // 5 Minuten
  documents: 5 * 60 * 1000, // 5 Minuten
  dashboard: 2 * 60 * 1000, // 2 Minuten
  licenseControl: 2 * 60 * 1000, // 2 Minuten
  licenseSettings: 30 * 60 * 1000, // 30 Minuten
} as const;
