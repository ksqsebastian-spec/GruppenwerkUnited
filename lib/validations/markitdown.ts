import { z } from 'zod';

/**
 * Sanitarisiert einen Tag-Wert: lower-case, trim, Whitespace zu Bindestrichen,
 * Sonderzeichen raus. Bereits gespeicherte Tags bleiben dadurch konsistent.
 */
function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 40);
}

const tagSchema = z
  .string()
  .trim()
  .min(1, 'Tag darf nicht leer sein')
  .max(40, 'Tag ist zu lang')
  .transform(normalizeTag)
  .refine((v) => v.length > 0, 'Tag enthält keine erlaubten Zeichen');

export const templateSchema = z.object({
  titel: z.string().trim().min(1, 'Titel ist erforderlich').max(200, 'Titel ist zu lang'),
  beschreibung: z.string().trim().max(1000, 'Beschreibung ist zu lang').nullish().or(z.literal('')),
  tags: z.array(tagSchema).max(20, 'Maximal 20 Tags'),
  markdown: z.string().trim().min(1, 'Markdown darf nicht leer sein').max(500_000, 'Markdown ist zu lang'),
  source_dateiname: z.string().trim().max(200).nullish().or(z.literal('')),
  source_dateityp: z.string().trim().max(120).nullish().or(z.literal('')),
  saved_by: z.string().trim().min(1, 'Bitte gib deinen Namen an').max(120, 'Name ist zu lang'),
});

export type TemplateInput = z.infer<typeof templateSchema>;

export { normalizeTag };
