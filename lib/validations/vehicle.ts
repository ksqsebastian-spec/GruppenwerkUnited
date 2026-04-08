import { z } from 'zod';

/**
 * Validierungsschema für Fahrzeug-Formulare
 */
export const vehicleSchema = z.object({
  license_plate: z
    .string()
    .min(1, 'Kennzeichen ist erforderlich')
    .max(20, 'Kennzeichen darf maximal 20 Zeichen haben')
    .regex(
      /^[A-ZÄÖÜ]{1,3}[-\s]?[A-ZÄÖÜ]{1,2}[-\s]?\d{1,4}[A-Z]?$/i,
      'Ungültiges Kennzeichen-Format (z.B. HH-AB 1234)'
    )
    .transform((val) => val.toUpperCase()),

  brand: z
    .string()
    .min(2, 'Marke muss mindestens 2 Zeichen haben')
    .max(100, 'Marke darf maximal 100 Zeichen haben'),

  model: z
    .string()
    .min(2, 'Modell muss mindestens 2 Zeichen haben')
    .max(100, 'Modell darf maximal 100 Zeichen haben'),

  year: z
    .number({
      required_error: 'Baujahr ist erforderlich',
      invalid_type_error: 'Baujahr muss eine Zahl sein',
    })
    .int('Baujahr muss eine ganze Zahl sein')
    .min(1990, 'Baujahr muss nach 1990 sein')
    .max(new Date().getFullYear() + 1, 'Baujahr darf nicht in der Zukunft liegen'),

  vin: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .refine(
      (val) => val === null || (val.length === 17 && /^[A-HJ-NPR-Z0-9]+$/i.test(val)),
      { message: 'Fahrgestellnummer muss genau 17 Zeichen haben (A-Z, 0-9, ohne I, O, Q)' }
    )
    .transform((val) => (val ? val.toUpperCase() : null)),

  fuel_type: z.enum(
    ['diesel', 'benzin', 'elektro', 'hybrid_benzin', 'hybrid_diesel', 'gas'],
    {
      required_error: 'Kraftstoffart ist erforderlich',
      invalid_type_error: 'Ungültige Kraftstoffart',
    }
  ),

  purchase_date: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return date <= new Date();
      },
      { message: 'Anschaffungsdatum darf nicht in der Zukunft liegen' }
    ),

  purchase_price: z
    .number()
    .positive('Anschaffungspreis muss größer als 0 sein')
    .nullish(),

  mileage: z
    .number({
      required_error: 'Kilometerstand ist erforderlich',
      invalid_type_error: 'Kilometerstand muss eine Zahl sein',
    })
    .int('Kilometerstand muss eine ganze Zahl sein')
    .min(0, 'Kilometerstand darf nicht negativ sein'),

  is_leased: z.boolean().default(false),

  // Leasing-Felder (optional, nur relevant wenn is_leased = true)
  leasing_company: z
    .string()
    .max(200, 'Leasinggeber darf maximal 200 Zeichen haben')
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),

  leasing_end_date: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),

  leasing_rate: z
    .number()
    .min(0, 'Leasingrate muss positiv sein')
    .nullish(),

  leasing_contract_number: z
    .string()
    .max(100, 'Vertragsnummer darf maximal 100 Zeichen haben')
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),

  // Halter & Nutzer
  holder: z
    .string()
    .max(200, 'Fahrzeughalter darf maximal 200 Zeichen haben')
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),

  user_name: z
    .string()
    .max(200, 'Hauptnutzer darf maximal 200 Zeichen haben')
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),

  insurance_number: z
    .string()
    .max(100, 'Versicherungsnummer darf maximal 100 Zeichen haben')
    .transform((val) => (val === '' ? null : val))
    .nullable(),

  insurance_company: z
    .string()
    .max(100, 'Versicherungsgesellschaft darf maximal 100 Zeichen haben')
    .transform((val) => (val === '' ? null : val))
    .nullable(),

  tuv_due_date: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .nullable(),

  company_id: z
    .string({
      required_error: 'Firma ist erforderlich',
    })
    .uuid('Ungültige Firmen-ID'),

  status: z.enum(['active', 'archived']).default('active'),

  notes: z
    .string()
    .max(2000, 'Notizen dürfen maximal 2000 Zeichen haben')
    .transform((val) => (val === '' ? null : val))
    .nullable(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;

/**
 * Schema für Fahrzeug-Suche
 */
export const vehicleSearchSchema = z.object({
  search: z.string().optional(),
  companyId: z.string().uuid().optional(),
  status: z.enum(['active', 'archived']).optional(),
  fuelType: z
    .enum(['diesel', 'benzin', 'elektro', 'hybrid_benzin', 'hybrid_diesel', 'gas'])
    .optional(),
});

export type VehicleSearchParams = z.infer<typeof vehicleSearchSchema>;
