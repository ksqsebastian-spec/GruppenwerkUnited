/**
 * Zentrale TypeScript-Typdefinitionen für die Fuhrpark Management App
 */

// ============================================================================
// Basis-Typen
// ============================================================================

export type FuelType =
  | 'diesel'
  | 'benzin'
  | 'elektro'
  | 'hybrid_benzin'
  | 'hybrid_diesel'
  | 'gas';

export type VehicleStatus = 'active' | 'archived';

export type DamageStatus = 'reported' | 'approved' | 'in_repair' | 'completed';

export type AppointmentStatus = 'pending' | 'completed' | 'overdue';

export type MileageSource = 'manual' | 'cost_entry' | 'damage_report';

// ============================================================================
// Firmen
// ============================================================================

export interface Company {
  id: string;
  name: string;
  created_at: string;
}

export type CompanyInsert = Omit<Company, 'id' | 'created_at'>;
export type CompanyUpdate = Partial<CompanyInsert>;

// ============================================================================
// Fahrzeuge
// ============================================================================

export interface Vehicle {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  vin: string | null;
  fuel_type: FuelType;
  purchase_date: string | null;
  purchase_price: number | null;
  mileage: number;
  is_leased: boolean;
  // Leasing-Felder (nur relevant wenn is_leased = true)
  leasing_company: string | null;
  leasing_end_date: string | null;
  leasing_rate: number | null;
  leasing_contract_number: string | null;
  // Halter & Nutzer
  holder: string | null;
  user_name: string | null;
  insurance_number: string | null;
  insurance_company: string | null;
  tuv_due_date: string | null;
  status: VehicleStatus;
  company_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relationen (optional, bei Joins)
  company?: Company;
  appointments?: Appointment[];
  damages?: Damage[];
  documents?: Document[];
  costs?: Cost[];
  vehicle_drivers?: VehicleDriver[];
}

// Utility type um Felder mit null-Werten optional zu machen und undefined zu erlauben
type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];

type NonNullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? never : K;
}[keyof T];

type NullableToOptional<T> = {
  [K in NonNullableKeys<T>]: T[K];
} & {
  [K in NullableKeys<T>]?: T[K] | undefined;
};

export type VehicleInsert = NullableToOptional<Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'company' | 'appointments' | 'damages' | 'documents' | 'costs' | 'vehicle_drivers'>>;
export type VehicleUpdate = Partial<VehicleInsert>;

// ============================================================================
// Fahrer
// ============================================================================

export interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  license_class: string | null;
  license_expiry: string | null;
  company_id: string;
  status: VehicleStatus;
  notes: string | null;
  is_license_inspector: boolean;
  is_uvv_instructor: boolean;
  created_at: string;
  updated_at: string;
  // Relationen (optional, bei Joins)
  company?: Company;
  vehicle_drivers?: VehicleDriver[];
}

export type DriverInsert = NullableToOptional<Omit<Driver, 'id' | 'created_at' | 'updated_at' | 'company' | 'vehicle_drivers'>>;
export type DriverUpdate = Partial<DriverInsert>;

// ============================================================================
// Fahrzeug-Fahrer-Zuordnung
// ============================================================================

export interface VehicleDriver {
  id: string;
  vehicle_id: string;
  driver_id: string;
  is_primary: boolean;
  assigned_at: string;
  // Relationen (optional, bei Joins)
  vehicle?: Vehicle;
  driver?: Driver;
}

export type VehicleDriverInsert = Omit<VehicleDriver, 'id' | 'assigned_at' | 'vehicle' | 'driver'>;
export type VehicleDriverUpdate = Partial<VehicleDriverInsert>;

// ============================================================================
// Dokumenttypen
// ============================================================================

export interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export type DocumentTypeInsert = Omit<DocumentType, 'id' | 'created_at'>;
export type DocumentTypeUpdate = Partial<DocumentTypeInsert>;

// ============================================================================
// Dokumente
// ============================================================================

/** Unterstützte Entity-Typen für Dokumente */
export type DocumentEntityType = 'vehicle' | 'damage' | 'appointment' | 'driver' | 'license_check_employee' | 'license_check' | 'uvv_check';

export interface Document {
  id: string;
  entity_type: DocumentEntityType;
  // Entity-Referenzen (genau eine muss gesetzt sein)
  vehicle_id: string | null;
  damage_id: string | null;
  appointment_id: string | null;
  driver_id: string | null;
  license_check_employee_id: string | null;
  license_check_id: string | null;
  uvv_check_id: string | null;
  // Dokument-Daten
  document_type_id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  notes: string | null;
  uploaded_at: string;
  // Relationen (optional, bei Joins)
  vehicle?: Vehicle;
  damage?: Damage;
  appointment?: Appointment;
  driver?: Driver;
  license_check_employee?: LicenseCheckEmployee;
  license_check?: LicenseCheck;
  uvv_check?: UvvCheck;
  document_type?: DocumentType;
}

export type DocumentInsert = Omit<Document, 'id' | 'uploaded_at' | 'vehicle' | 'damage' | 'appointment' | 'driver' | 'license_check_employee' | 'license_check' | 'uvv_check' | 'document_type'>;
export type DocumentUpdate = Partial<Omit<DocumentInsert, 'entity_type'>>;

// ============================================================================
// Termintypen
// ============================================================================

export interface AppointmentType {
  id: string;
  name: string;
  default_interval_months: number | null;
  color: string;
  created_at: string;
}

export type AppointmentTypeInsert = Omit<AppointmentType, 'id' | 'created_at'>;
export type AppointmentTypeUpdate = Partial<AppointmentTypeInsert>;

// ============================================================================
// Termine
// ============================================================================

export interface Appointment {
  id: string;
  vehicle_id: string;
  appointment_type_id: string;
  due_date: string;
  completed_date: string | null;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relationen (optional, bei Joins)
  vehicle?: Vehicle;
  appointment_type?: AppointmentType;
}

export type AppointmentInsert = NullableToOptional<Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'vehicle' | 'appointment_type'>>;
export type AppointmentUpdate = Partial<AppointmentInsert>;

// ============================================================================
// Schadenstypen
// ============================================================================

export interface DamageType {
  id: string;
  name: string;
  created_at: string;
}

export type DamageTypeInsert = Omit<DamageType, 'id' | 'created_at'>;
export type DamageTypeUpdate = Partial<DamageTypeInsert>;

// ============================================================================
// Schäden
// ============================================================================

export interface Damage {
  id: string;
  vehicle_id: string;
  damage_type_id: string;
  date: string;
  description: string;
  location: string | null;
  cost_estimate: number | null;
  actual_cost: number | null;
  insurance_claim: boolean;
  insurance_claim_number: string | null;
  status: DamageStatus;
  reported_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relationen (optional, bei Joins)
  vehicle?: Vehicle;
  damage_type?: DamageType;
  damage_images?: DamageImage[];
}

export type DamageInsert = NullableToOptional<Omit<Damage, 'id' | 'created_at' | 'updated_at' | 'vehicle' | 'damage_type' | 'damage_images'>>;
export type DamageUpdate = Partial<DamageInsert>;

// ============================================================================
// Schadensbilder
// ============================================================================

export interface DamageImage {
  id: string;
  damage_id: string;
  file_path: string;
  uploaded_at: string;
  // Relationen (optional, bei Joins)
  damage?: Damage;
}

export type DamageImageInsert = Omit<DamageImage, 'id' | 'uploaded_at' | 'damage'>;

// ============================================================================
// Kostentypen
// ============================================================================

export interface CostType {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
}

export type CostTypeInsert = Omit<CostType, 'id' | 'created_at'>;
export type CostTypeUpdate = Partial<CostTypeInsert>;

// ============================================================================
// Kosten
// ============================================================================

export interface Cost {
  id: string;
  vehicle_id: string;
  cost_type_id: string;
  date: string;
  amount: number;
  description: string | null;
  mileage_at_cost: number | null;
  receipt_path: string | null;
  notes: string | null;
  created_at: string;
  // Relationen (optional, bei Joins)
  vehicle?: Vehicle;
  cost_type?: CostType;
}

export type CostInsert = NullableToOptional<Omit<Cost, 'id' | 'created_at' | 'vehicle' | 'cost_type'>>;
export type CostUpdate = Partial<CostInsert>;

// ============================================================================
// Kilometerstand-Historie
// ============================================================================

export interface MileageLog {
  id: string;
  vehicle_id: string;
  mileage: number;
  recorded_at: string;
  source: MileageSource;
  notes: string | null;
  // Relationen (optional, bei Joins)
  vehicle?: Vehicle;
}

export type MileageLogInsert = Omit<MileageLog, 'id' | 'recorded_at' | 'vehicle'>;

// ============================================================================
// Dashboard-Typen
// ============================================================================

export interface DashboardStats {
  vehicleCount: number;
  openDamages: number;
  costsThisMonth: number;
  driverCount: number;
}

export interface UpcomingAppointments {
  overdue: Appointment[];
  urgent: Appointment[];
  upcoming: Appointment[];
}

/**
 * Termin mit Fahrzeug-Relation für Dashboard-Warnungen
 */
export interface AppointmentWithVehicle extends Omit<Appointment, 'vehicle'> {
  type: string;
  vehicle: {
    id: string;
    license_plate: string;
    brand: string;
    model: string;
  } | null;
}

/**
 * Aktivität für das Dashboard
 */
export interface DashboardActivity {
  id: string;
  type: 'vehicle' | 'damage' | 'cost' | 'appointment';
  description: string;
  created_at: string;
}

// ============================================================================
// Filter-Typen
// ============================================================================

export interface VehicleFilters {
  companyId?: string;
  status?: VehicleStatus;
  search?: string;
  fuelType?: FuelType;
}

export interface DamageFilters {
  vehicleId?: string;
  status?: DamageStatus;
}

export interface AppointmentFilters {
  vehicleId?: string;
  status?: AppointmentStatus;
  dueBefore?: Date;
  dueAfter?: Date;
}

export interface CostFilters {
  vehicleId?: string;
  costTypeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DocumentFilters {
  entityType?: DocumentEntityType;
  documentTypeId?: string;
  vehicleId?: string;
  dateFrom?: string;
  dateTo?: string;
  fileType?: 'pdf' | 'image' | 'all';
  search?: string;
}

export type DocumentSortField = 'uploaded_at' | 'name' | 'entity_type' | 'file_size';
export type SortDirection = 'asc' | 'desc';

// ============================================================================
// CSV Import/Export
// ============================================================================

export interface CSVImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

// ============================================================================
// Führerscheinkontrolle - Status-Typen
// ============================================================================

export type LicenseEmployeeStatus = 'active' | 'archived';
export type LicenseInspectorStatus = 'active' | 'archived';

/** Status der Führerscheinkontrolle für einen Mitarbeiter */
export type LicenseCheckStatus = 'overdue' | 'due_soon' | 'ok';

// ============================================================================
// Führerscheinkontrolle - Einstellungen
// ============================================================================

export interface LicenseCheckSettings {
  id: string;
  check_interval_months: number;
  warning_days_before: number;
  updated_at: string;
}

export type LicenseCheckSettingsUpdate = Partial<Omit<LicenseCheckSettings, 'id' | 'updated_at'>>;

// ============================================================================
// Führerscheinkontrolle - Prüfer
// ============================================================================

export interface LicenseCheckInspector {
  id: string;
  name: string;
  email: string | null;
  status: LicenseInspectorStatus;
  created_at: string;
}

export type LicenseCheckInspectorInsert = Omit<LicenseCheckInspector, 'id' | 'created_at'>;
export type LicenseCheckInspectorUpdate = Partial<LicenseCheckInspectorInsert>;

// ============================================================================
// Führerscheinkontrolle - Mitarbeiter
// ============================================================================

export interface LicenseCheckEmployee {
  id: string;
  first_name: string;
  last_name: string;
  personnel_number: string | null;
  company_id: string;
  email: string | null;
  license_classes: string;
  license_number: string | null;
  license_expiry_date: string | null;
  status: LicenseEmployeeStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relationen (optional, bei Joins)
  company?: Company;
  license_checks?: LicenseCheck[];
  documents?: Document[];
  // Berechnete Felder (werden im Frontend hinzugefügt)
  latest_check?: LicenseCheck | null;
  check_status?: LicenseCheckStatus;
  next_check_due?: string | null;
}

export type LicenseCheckEmployeeInsert = NullableToOptional<
  Omit<LicenseCheckEmployee, 'id' | 'created_at' | 'updated_at' | 'company' | 'license_checks' | 'documents' | 'latest_check' | 'check_status' | 'next_check_due'>
>;
export type LicenseCheckEmployeeUpdate = Partial<LicenseCheckEmployeeInsert>;

// ============================================================================
// Führerscheinkontrolle - Kontrollen
// ============================================================================

export interface LicenseCheck {
  id: string;
  employee_id: string | null;
  driver_id: string | null;
  check_date: string;
  checked_by_id: string;
  license_verified: boolean;
  next_check_due: string;
  notes: string | null;
  created_at: string;
  // Relationen (optional, bei Joins)
  employee?: LicenseCheckEmployee;
  driver?: Driver;
  checked_by?: LicenseCheckInspector;
  documents?: Document[];
}

export type LicenseCheckInsert = Omit<LicenseCheck, 'id' | 'created_at' | 'employee' | 'driver' | 'checked_by' | 'documents'>;

// ============================================================================
// Führerscheinkontrolle - Filter
// ============================================================================

export interface LicenseCheckEmployeeFilters {
  companyId?: string;
  status?: LicenseEmployeeStatus;
  checkStatus?: LicenseCheckStatus;
  search?: string;
}

// ============================================================================
// Führerscheinkontrolle - Dashboard/Stats
// ============================================================================

export interface LicenseControlStats {
  totalEmployees: number;
  overdueCount: number;
  dueSoonCount: number;
  okCount: number;
}

// ============================================================================
// Führerscheinkontrolle - Fahrer mit Kontrollstatus
// ============================================================================

export interface DriverWithLicenseStatus extends Driver {
  latest_license_check?: LicenseCheck | null;
  check_status?: LicenseCheckStatus;
  next_check_due?: string | null;
}

// ============================================================================
// Führerscheinkontrolle - Filter (Fahrer-basiert)
// ============================================================================

export interface LicenseDriverFilters {
  status?: VehicleStatus;
  checkStatus?: LicenseCheckStatus;
  search?: string;
}

// ============================================================================
// UVV-Kontrolle (Fahrerunterweisung) - Status-Typen
// ============================================================================

export type UvvInstructorStatus = 'active' | 'archived';

/** Status der UVV-Unterweisung für einen Fahrer */
export type UvvCheckStatus = 'overdue' | 'due_soon' | 'ok';

// ============================================================================
// UVV-Kontrolle - Einstellungen
// ============================================================================

export interface UvvSettings {
  id: string;
  check_interval_months: number;
  warning_days_before: number;
  default_topics: string | null;
  updated_at: string;
}

export type UvvSettingsUpdate = Partial<Omit<UvvSettings, 'id' | 'updated_at'>>;

// ============================================================================
// UVV-Kontrolle - Unterweisende
// ============================================================================

export interface UvvInstructor {
  id: string;
  name: string;
  email: string | null;
  status: UvvInstructorStatus;
  created_at: string;
}

export type UvvInstructorInsert = Omit<UvvInstructor, 'id' | 'created_at'>;
export type UvvInstructorUpdate = Partial<UvvInstructorInsert>;

// ============================================================================
// UVV-Kontrolle - Unterweisungen
// ============================================================================

export interface UvvCheck {
  id: string;
  driver_id: string;
  check_date: string;
  instructed_by_id: string;
  topics: string | null;
  next_check_due: string;
  notes: string | null;
  created_at: string;
  // Relationen (optional, bei Joins)
  driver?: Driver;
  instructed_by?: UvvInstructor;
  documents?: Document[];
}

export type UvvCheckInsert = Omit<UvvCheck, 'id' | 'created_at' | 'driver' | 'instructed_by' | 'documents'>;

// ============================================================================
// UVV-Kontrolle - Fahrer mit UVV-Status
// ============================================================================

export interface DriverWithUvvStatus extends Driver {
  latest_uvv_check?: UvvCheck | null;
  uvv_status?: UvvCheckStatus;
  next_uvv_due?: string | null;
}

// ============================================================================
// UVV-Kontrolle - Filter
// ============================================================================

export interface UvvDriverFilters {
  companyId?: string;
  status?: VehicleStatus;
  uvvStatus?: UvvCheckStatus;
  search?: string;
}

// ============================================================================
// UVV-Kontrolle - Dashboard/Stats
// ============================================================================

export interface UvvControlStats {
  totalDrivers: number;
  overdueCount: number;
  dueSoonCount: number;
  okCount: number;
}

// ============================================================================
// Datenkodierung
// ============================================================================

export interface Datenkodierung {
  id: string;
  code: string;
  name: string;
  adresse: string | null;
  notizen: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type DatenkodierungInsert = Omit<Datenkodierung, 'id' | 'code' | 'created_at' | 'updated_at'>;
