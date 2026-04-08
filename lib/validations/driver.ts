import { z } from 'zod';

/**
 * Validierungsschema für Fahrer-Formulare
 */
export const driverSchema = z.object({
  first_name: z
    .string()
    .min(2, 'Vorname muss mindestens 2 Zeichen haben')
    .max(100, 'Vorname darf maximal 100 Zeichen haben'),

  last_name: z
    .string()
    .min(2, 'Nachname muss mindestens 2 Zeichen haben')
    .max(100, 'Nachname darf maximal 100 Zeichen haben'),

  email: z
    .string()
    .email('Bitte gib eine gültige E-Mail-Adresse ein')
    .max(255, 'E-Mail darf maximal 255 Zeichen haben')
    .nullish()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),

  phone: z
    .string()
    .max(50, 'Telefonnummer darf maximal 50 Zeichen haben')
    .nullish()
    .transform((val) => (val === '' ? null : val)),

  license_class: z
    .string()
    .max(50, 'Führerscheinklasse darf maximal 50 Zeichen haben')
    .nullish()
    .transform((val) => (val === '' ? null : val)),

  license_expiry: z
    .string()
    .nullish()
    .transform((val) => (val === '' ? null : val)),

  company_id: z
    .string({
      required_error: 'Firma ist erforderlich',
    })
    .uuid('Ungültige Firmen-ID'),

  status: z.enum(['active', 'archived']).default('active'),

  notes: z
    .string()
    .max(2000, 'Notizen dürfen maximal 2000 Zeichen haben')
    .nullish()
    .transform((val) => (val === '' ? null : val)),
});

export type DriverFormData = z.infer<typeof driverSchema>;

/**
 * Schema für Fahrer-Fahrzeug-Zuordnung
 */
export const vehicleDriverSchema = z.object({
  vehicle_id: z.string().uuid('Ungültige Fahrzeug-ID'),
  driver_id: z.string().uuid('Ungültige Fahrer-ID'),
  is_primary: z.boolean().default(false),
});

export type VehicleDriverFormData = z.infer<typeof vehicleDriverSchema>;
