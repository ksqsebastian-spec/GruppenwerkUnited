import { z } from 'zod';

// ============================================================================
// UVV-Einstellungen
// ============================================================================

export const uvvSettingsSchema = z.object({
  check_interval_months: z.number()
    .min(1, 'Intervall muss mindestens 1 Monat sein')
    .max(24, 'Intervall darf maximal 24 Monate sein'),
  warning_days_before: z.number()
    .min(0, 'Warnungstage müssen mindestens 0 sein')
    .max(90, 'Warnungstage dürfen maximal 90 sein'),
  default_topics: z.string()
    .max(2000, 'Themen dürfen maximal 2000 Zeichen haben')
    .nullish()
    .transform((val) => (!val || val === '' ? null : val)),
});

export type UvvSettingsFormData = z.infer<typeof uvvSettingsSchema>;

// ============================================================================
// Unterweisende
// ============================================================================

export const uvvInstructorSchema = z.object({
  name: z.string()
    .min(2, 'Name muss mindestens 2 Zeichen haben')
    .max(100, 'Name darf maximal 100 Zeichen haben'),
  email: z.string()
    .email('Bitte gib eine gültige E-Mail-Adresse ein')
    .max(255)
    .nullish()
    .or(z.literal(''))
    .transform((val) => (!val || val === '' ? null : val)),
  status: z.enum(['active', 'archived']).default('active'),
});

export type UvvInstructorFormData = z.infer<typeof uvvInstructorSchema>;

// ============================================================================
// UVV-Unterweisungen
// ============================================================================

export const uvvCheckSchema = z.object({
  driver_id: z.string().uuid('Ungültige Fahrer-ID'),
  check_date: z.string().min(1, 'Datum ist erforderlich'),
  instructed_by_id: z.string().uuid('Bitte wähle einen Unterweisenden aus'),
  topics: z.string()
    .max(2000, 'Themen dürfen maximal 2000 Zeichen haben')
    .nullish()
    .transform((val) => (!val || val === '' ? null : val)),
  next_check_due: z.string().min(1, 'Nächstes Datum ist erforderlich'),
  notes: z.string()
    .max(2000, 'Notizen dürfen maximal 2000 Zeichen haben')
    .nullish()
    .transform((val) => (!val || val === '' ? null : val)),
});

export type UvvCheckFormData = z.infer<typeof uvvCheckSchema>;

// ============================================================================
// Batch-UVV-Unterweisung (für Sammel-Unterweisungen)
// ============================================================================

export const batchUvvCheckSchema = z.object({
  check_date: z.string().min(1, 'Datum ist erforderlich'),
  instructed_by_id: z.string().uuid('Bitte wähle einen Unterweisenden aus'),
  topics: z.string()
    .max(2000)
    .nullish()
    .transform((val) => (!val || val === '' ? null : val)),
  next_check_due: z.string().min(1, 'Nächstes Datum ist erforderlich'),
  notes: z.string()
    .max(2000)
    .nullish()
    .transform((val) => (!val || val === '' ? null : val)),
});

export type BatchUvvCheckFormData = z.infer<typeof batchUvvCheckSchema>;

// Alias für Kompatibilität
export const quickUvvCheckSchema = batchUvvCheckSchema;
export type QuickUvvCheckFormData = BatchUvvCheckFormData;
