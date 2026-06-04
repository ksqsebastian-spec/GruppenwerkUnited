import { z } from 'zod';

const statusEnum = z.enum(['aktiv', 'inaktiv', 'prospect', 'archiviert']);

export const customerSchema = z.object({
  firmenname: z.string().trim().min(1, 'Firmenname ist erforderlich').max(200, 'Firmenname ist zu lang'),
  ansprechpartner: z.string().trim().max(200, 'Ansprechpartner ist zu lang').nullish().or(z.literal('')),
  email: z.string().trim().email('Ungültige E-Mail-Adresse').nullish().or(z.literal('')),
  telefon: z.string().trim().max(40, 'Telefonnummer ist zu lang').nullish().or(z.literal('')),
  adresse: z.string().trim().max(500, 'Adresse ist zu lang').nullish().or(z.literal('')),
  status: statusEnum,
  notizen: z.string().trim().max(5000, 'Notizen sind zu lang').nullish().or(z.literal('')),
});

export const customerUpdateSchema = customerSchema.partial();

export const customerKommentarSchema = z.object({
  text: z.string().trim().min(1, 'Kommentar darf nicht leer sein').max(5000, 'Kommentar ist zu lang'),
});

export const customerPromptSchema = z.object({
  name: z.string().trim().min(1, 'Name ist erforderlich').max(120, 'Name ist zu lang'),
  beschreibung: z.string().trim().max(500, 'Beschreibung ist zu lang').nullish().or(z.literal('')),
  kategorie: z.string().trim().max(80, 'Kategorie ist zu lang').nullish().or(z.literal('')),
  template: z.string().trim().min(1, 'Vorlage darf nicht leer sein').max(20000, 'Vorlage ist zu lang'),
});

export const customerPromptUpdateSchema = customerPromptSchema.partial();

export type CustomerFormData = z.infer<typeof customerSchema>;
export type CustomerPromptFormData = z.infer<typeof customerPromptSchema>;
