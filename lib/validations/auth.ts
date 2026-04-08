import { z } from 'zod';

/**
 * Validierungsschema für Login-Formular
 * Nur Passwort erforderlich (geteilter Account gemäß PRD 4.3)
 */
export const loginSchema = z.object({
  password: z
    .string()
    .min(1, 'Passwort ist erforderlich'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
