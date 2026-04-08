import { z } from 'zod';

/**
 * Validierungsschema für Führerscheinkontrolle-Einstellungen
 */
export const licenseSettingsSchema = z.object({
  check_interval_months: z
    .number({
      required_error: 'Intervall ist erforderlich',
      invalid_type_error: 'Intervall muss eine Zahl sein',
    })
    .min(1, 'Intervall muss mindestens 1 Monat sein')
    .max(24, 'Intervall darf maximal 24 Monate sein'),

  warning_days_before: z
    .number({
      required_error: 'Warnungstage sind erforderlich',
      invalid_type_error: 'Warnungstage müssen eine Zahl sein',
    })
    .min(0, 'Warnungstage müssen mindestens 0 sein')
    .max(90, 'Warnungstage dürfen maximal 90 sein'),
});

export type LicenseSettingsFormData = z.infer<typeof licenseSettingsSchema>;

/**
 * Validierungsschema für Prüfer
 */
export const licenseInspectorSchema = z.object({
  name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen haben')
    .max(100, 'Name darf maximal 100 Zeichen haben'),

  email: z
    .string()
    .email('Bitte gib eine gültige E-Mail-Adresse ein')
    .max(255, 'E-Mail darf maximal 255 Zeichen haben')
    .nullish()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),

  status: z.enum(['active', 'archived']).default('active'),
});

export type LicenseInspectorFormData = z.infer<typeof licenseInspectorSchema>;

/**
 * Validierungsschema für Mitarbeiter (Führerscheinkontrolle)
 */
export const licenseEmployeeSchema = z.object({
  first_name: z
    .string()
    .min(2, 'Vorname muss mindestens 2 Zeichen haben')
    .max(100, 'Vorname darf maximal 100 Zeichen haben'),

  last_name: z
    .string()
    .min(2, 'Nachname muss mindestens 2 Zeichen haben')
    .max(100, 'Nachname darf maximal 100 Zeichen haben'),

  personnel_number: z
    .string()
    .max(50, 'Personalnummer darf maximal 50 Zeichen haben')
    .nullish()
    .transform((val) => (val === '' ? null : val)),

  company_id: z
    .string({
      required_error: 'Firma ist erforderlich',
    })
    .uuid('Ungültige Firmen-ID'),

  email: z
    .string()
    .email('Bitte gib eine gültige E-Mail-Adresse ein')
    .max(255, 'E-Mail darf maximal 255 Zeichen haben')
    .nullish()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),

  license_classes: z
    .string({
      required_error: 'Führerscheinklassen sind erforderlich',
    })
    .min(1, 'Führerscheinklassen sind erforderlich'),

  license_number: z
    .string()
    .max(50, 'Führerscheinnummer darf maximal 50 Zeichen haben')
    .nullish()
    .transform((val) => (val === '' ? null : val)),

  license_expiry_date: z
    .string()
    .nullish()
    .transform((val) => (val === '' ? null : val)),

  status: z.enum(['active', 'archived']).default('active'),

  notes: z
    .string()
    .max(2000, 'Notizen dürfen maximal 2000 Zeichen haben')
    .nullish()
    .transform((val) => (val === '' ? null : val)),
});

export type LicenseEmployeeFormData = z.infer<typeof licenseEmployeeSchema>;

/**
 * Validierungsschema für Führerscheinkontrolle (vollständiges Formular)
 */
export const licenseCheckSchema = z.object({
  employee_id: z
    .string({
      required_error: 'Mitarbeiter ist erforderlich',
    })
    .uuid('Ungültige Mitarbeiter-ID'),

  check_date: z
    .string({
      required_error: 'Kontrolldatum ist erforderlich',
    })
    .min(1, 'Kontrolldatum ist erforderlich'),

  checked_by_id: z
    .string({
      required_error: 'Prüfer ist erforderlich',
    })
    .uuid('Ungültige Prüfer-ID'),

  license_verified: z.boolean().default(false),

  next_check_due: z
    .string({
      required_error: 'Nächstes Kontrolldatum ist erforderlich',
    })
    .min(1, 'Nächstes Kontrolldatum ist erforderlich'),

  notes: z
    .string()
    .max(2000, 'Notizen dürfen maximal 2000 Zeichen haben')
    .nullish()
    .transform((val) => (val === '' ? null : val)),
});

export type LicenseCheckFormData = z.infer<typeof licenseCheckSchema>;

/**
 * Validierungsschema für Schnellkontrolle (vereinfachtes Formular)
 * Wird im Check-Dialog verwendet, employee_id und Datums werden automatisch gesetzt
 */
export const quickLicenseCheckSchema = z.object({
  checked_by_id: z
    .string({
      required_error: 'Prüfer ist erforderlich',
    })
    .uuid('Bitte wähle einen Prüfer aus'),

  license_verified: z.boolean().default(false),

  notes: z
    .string()
    .max(2000, 'Notizen dürfen maximal 2000 Zeichen haben')
    .nullish()
    .transform((val) => (val === '' ? null : val)),
});

export type QuickLicenseCheckFormData = z.infer<typeof quickLicenseCheckSchema>;
