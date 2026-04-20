import { z } from 'zod';

export const datenkodierungSchema = z.object({
  name: z.string().trim().min(2, 'Name muss mindestens 2 Zeichen haben'),
  adresse: z.string().trim().optional(),
  notizen: z.string().trim().optional(),
});

export type DatenkodierungFormData = z.infer<typeof datenkodierungSchema>;
