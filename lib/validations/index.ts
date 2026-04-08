/**
 * Zentrale Export-Datei für alle Validierungsschemas
 */

export { vehicleSchema, vehicleSearchSchema } from './vehicle';
export type { VehicleFormData, VehicleSearchParams } from './vehicle';

export { driverSchema, vehicleDriverSchema } from './driver';
export type { DriverFormData, VehicleDriverFormData } from './driver';

export { appointmentSchema, appointmentTypeSchema } from './appointment';
export type { AppointmentFormData, AppointmentTypeFormData } from './appointment';

export { damageSchema, damageTypeSchema } from './damage';
export type { DamageFormData, DamageTypeFormData } from './damage';

export { costSchema, costTypeSchema } from './cost';
export type { CostFormData, CostTypeFormData } from './cost';

export { fileUploadSchema, documentUploadSchema, documentTypeSchema } from './file-upload';
export type { FileUploadFormData, DocumentUploadFormData, DocumentTypeFormData } from './file-upload';

export { companySchema } from './company';
export type { CompanyFormData } from './company';

export { loginSchema } from './auth';
export type { LoginFormData } from './auth';
