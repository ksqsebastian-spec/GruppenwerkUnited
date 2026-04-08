import { z } from 'zod';

/**
 * Validierungsschema für Kosten-Formulare
 */
export const costSchema = z.object({
  vehicle_id: z
    .string({
      required_error: 'Fahrzeug ist erforderlich',
    })
    .uuid('Ungültige Fahrzeug-ID'),

  cost_type_id: z
    .string({
      required_error: 'Kostenart ist erforderlich',
    })
    .uuid('Ungültige Kostenart-ID'),

  date: z
    .string({
      required_error: 'Datum ist erforderlich',
    })
    .min(1, 'Datum ist erforderlich')
    .refine(
      (val) => {
        const date = new Date(val);
        return date <= new Date();
      },
      { message: 'Datum darf nicht in der Zukunft liegen' }
    ),

  amount: z
    .number({
      required_error: 'Betrag ist erforderlich',
      invalid_type_error: 'Betrag muss eine Zahl sein',
    })
    .positive('Betrag muss größer als 0 sein')
    .max(1000000, 'Betrag darf maximal 1.000.000 € sein'),

  description: z
    .string()
    .max(500, 'Beschreibung darf maximal 500 Zeichen haben')
    .nullish(),

  mileage_at_cost: z
    .number()
    .int('Kilometerstand muss eine ganze Zahl sein')
    .min(0, 'Kilometerstand darf nicht negativ sein')
    .nullish(),

  receipt_path: z.string().nullish(),

  notes: z
    .string()
    .max(2000, 'Notizen dürfen maximal 2000 Zeichen haben')
    .nullish(),
});

export type CostFormData = z.infer<typeof costSchema>;

/**
 * Validierungsschema für Kostentypen
 */
export const costTypeSchema = z.object({
  name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen haben')
    .max(100, 'Name darf maximal 100 Zeichen haben'),

  icon: z
    .string()
    .max(50, 'Icon darf maximal 50 Zeichen haben')
    .nullish(),
});

export type CostTypeFormData = z.infer<typeof costTypeSchema>;
