import { z } from 'zod';

/**
 * Validierungsschema für Termin-Formulare
 */
export const appointmentSchema = z.object({
  vehicle_id: z
    .string({
      required_error: 'Fahrzeug ist erforderlich',
    })
    .uuid('Ungültige Fahrzeug-ID'),

  appointment_type_id: z
    .string({
      required_error: 'Termintyp ist erforderlich',
    })
    .uuid('Ungültige Termintyp-ID'),

  due_date: z
    .string({
      required_error: 'Fälligkeitsdatum ist erforderlich',
    })
    .min(1, 'Fälligkeitsdatum ist erforderlich'),

  completed_date: z.string().nullish(),

  status: z.enum(['pending', 'completed', 'overdue']).default('pending'),

  notes: z
    .string()
    .max(2000, 'Notizen dürfen maximal 2000 Zeichen haben')
    .nullish(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

/**
 * Validierungsschema für Termintypen
 */
export const appointmentTypeSchema = z.object({
  name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen haben')
    .max(100, 'Name darf maximal 100 Zeichen haben'),

  default_interval_months: z
    .number()
    .int('Intervall muss eine ganze Zahl sein')
    .min(1, 'Intervall muss mindestens 1 Monat sein')
    .max(120, 'Intervall darf maximal 120 Monate sein')
    .nullish(),

  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Ungültiges Farbformat (z.B. #FF0000)')
    .default('#6B7280'),
});

export type AppointmentTypeFormData = z.infer<typeof appointmentTypeSchema>;
