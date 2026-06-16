import { z } from 'zod';

export const ticketSchema = z.object({
  title: z.string().trim().min(1, 'Aufgabe ist erforderlich').max(200, 'Aufgabe ist zu lang (max. 200 Zeichen)'),
  description: z.string().trim().max(5000, 'Beschreibung ist zu lang').nullish(),
  assignee_person_id: z.string().uuid('Ungültige Person').nullish(),
  firma: z.string().trim().nullish(),
  urgency: z.enum(['niedrig', 'mittel', 'hoch']),
  status: z.enum(['offen', 'in_arbeit', 'erledigt']),
  due_date: z.string().nullish(),
});

export const personSchema = z.object({
  name: z.string().trim().min(1, 'Name ist erforderlich').max(120, 'Name ist zu lang'),
  email: z.string().trim().email('Ungültige E-Mail-Adresse').nullish().or(z.literal('')),
  rolle: z.string().trim().max(120, 'Rolle ist zu lang').nullish(),
  firma: z.string().trim().max(60, 'Firma ist zu lang').nullish().or(z.literal('')),
});
