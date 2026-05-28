import { z } from 'zod';

// App-Typen eines Automatisierungsknotens (siehe AutomatisierungAppTyp)
const appTypeEnum = z.enum([
  'gdrive',
  'outlook',
  'email',
  'sheets',
  'word',
  'claude',
  'ai',
  'pdf',
  'generic',
]);

/**
 * Eingabe-Schema für das Anlegen eines Knotens.
 * `company` wird serverseitig aus der Session gesetzt – nie vom Client.
 */
export const knotenCreateSchema = z.object({
  parent_id: z.string().uuid('Ungültiger Eltern-Knoten').nullish(),
  title: z.string().trim().min(1, 'Titel ist erforderlich').max(200, 'Titel ist zu lang (max. 200 Zeichen)'),
  description: z.string().trim().max(5000, 'Beschreibung ist zu lang').nullish(),
  app_type: appTypeEnum,
  prompt_template: z.string().trim().max(20000, 'Prompt ist zu lang').nullish(),
  gdrive_path: z.string().trim().max(500, 'Pfad ist zu lang').nullish(),
  position_x: z.number(),
  position_y: z.number(),
  position: z.number().int(),
  use_datenkodierung: z.boolean(),
  is_active: z.boolean(),
});

/** Update-Schema: alle Felder optional. */
export const knotenUpdateSchema = knotenCreateSchema.partial();

/** Positions-Update nach Drag im Canvas. */
export const knotenPositionSchema = z.object({
  position_x: z.number(),
  position_y: z.number(),
});

export type KnotenCreateInput = z.infer<typeof knotenCreateSchema>;
export type KnotenUpdateInput = z.infer<typeof knotenUpdateSchema>;
