import { z } from 'zod';

/**
 * Validierungsschema für Firmen-Formulare
 */
export const companySchema = z.object({
  name: z
    .string()
    .min(2, 'Firmenname muss mindestens 2 Zeichen haben')
    .max(255, 'Firmenname darf maximal 255 Zeichen haben'),
});

export type CompanyFormData = z.infer<typeof companySchema>;
