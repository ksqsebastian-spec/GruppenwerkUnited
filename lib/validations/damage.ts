import { z } from 'zod';

/**
 * Validierungsschema für Schadens-Formulare
 */
export const damageSchema = z.object({
  vehicle_id: z
    .string({
      required_error: 'Fahrzeug ist erforderlich',
    })
    .uuid('Ungültige Fahrzeug-ID'),

  damage_type_id: z
    .string({
      required_error: 'Schadensart ist erforderlich',
    })
    .uuid('Ungültige Schadensart-ID'),

  date: z
    .string({
      required_error: 'Schadensdatum ist erforderlich',
    })
    .min(1, 'Schadensdatum ist erforderlich')
    .refine(
      (val) => {
        const date = new Date(val);
        return date <= new Date();
      },
      { message: 'Schadensdatum darf nicht in der Zukunft liegen' }
    ),

  description: z
    .string({
      required_error: 'Beschreibung ist erforderlich',
    })
    .min(10, 'Beschreibung muss mindestens 10 Zeichen haben')
    .max(5000, 'Beschreibung darf maximal 5000 Zeichen haben'),

  location: z
    .string()
    .max(255, 'Ort darf maximal 255 Zeichen haben')
    .nullish(),

  cost_estimate: z
    .number()
    .min(0, 'Geschätzte Kosten dürfen nicht negativ sein')
    .nullish(),

  actual_cost: z
    .number()
    .min(0, 'Tatsächliche Kosten dürfen nicht negativ sein')
    .nullish(),

  insurance_claim: z.boolean().default(false),

  insurance_claim_number: z
    .string()
    .max(100, 'Schadensnummer darf maximal 100 Zeichen haben')
    .nullish(),

  status: z.enum(['reported', 'approved', 'in_repair', 'completed']).default('reported'),

  reported_by: z
    .string({
      required_error: 'Gemeldet von ist erforderlich',
    })
    .min(2, 'Name muss mindestens 2 Zeichen haben')
    .max(255, 'Name darf maximal 255 Zeichen haben'),

  notes: z
    .string()
    .max(2000, 'Notizen dürfen maximal 2000 Zeichen haben')
    .nullish(),
});

export type DamageFormData = z.infer<typeof damageSchema>;

/**
 * Validierungsschema für Schadenstypen
 */
export const damageTypeSchema = z.object({
  name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen haben')
    .max(100, 'Name darf maximal 100 Zeichen haben'),
});

export type DamageTypeFormData = z.infer<typeof damageTypeSchema>;
