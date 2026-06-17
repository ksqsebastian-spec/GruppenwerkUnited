import { z } from 'zod';

import { FIRMEN_CONFIG } from '@/lib/tickets/firmen';

const firmenSlugs = FIRMEN_CONFIG.map((f) => f.id) as [string, ...string[]];

export const bildMetaSchema = z.object({
  titel: z.string().trim().max(200, 'Titel ist zu lang').nullish().or(z.literal('')),
  beschreibung: z.string().trim().max(1000, 'Beschreibung ist zu lang').nullish().or(z.literal('')),
  firmen_tags: z.array(z.enum(firmenSlugs)).max(FIRMEN_CONFIG.length),
  uploaded_by: z
    .string()
    .trim()
    .min(1, 'Bitte gib deinen Namen an')
    .max(120, 'Name ist zu lang'),
});

export type BildMetaInput = z.infer<typeof bildMetaSchema>;
