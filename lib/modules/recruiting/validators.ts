import { z } from "zod/v4";

export const empfehlungCreateSchema = z.object({
  kandidat_name: z.string().min(1, "Name ist erforderlich").max(120),
  kandidat_kontakt: z.string().max(200).optional(),
  empfehler_name: z.string().min(1, "Name ist erforderlich").max(120),
  empfehler_email: z.email("Ungültige E-Mail-Adresse").max(200),
  stelle_id: z.string().uuid("Ungültige Stellen-ID"),
  position: z.string().max(200).optional(),
  ref_code: z
    .string()
    .regex(/^#SEE-\d{4}-[A-Z0-9]{4,6}$/, "Ungültiges Ref-Code Format")
    .optional(),
});

export const empfehlungStatusUpdateSchema = z.object({
  status: z.enum(["offen", "eingestellt", "probezeit_bestanden", "ausgezahlt"]),
});

export const stelleCreateSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich").max(200),
  description: z.string().max(2000).optional(),
  praemie_betrag: z.number().min(0).max(99999).optional(),
});

export const stelleUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  active: z.boolean().optional(),
  praemie_betrag: z.number().min(0).max(99999).optional().nullable(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
