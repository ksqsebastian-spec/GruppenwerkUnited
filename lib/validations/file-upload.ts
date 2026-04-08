import { z } from 'zod';
import { FILE_UPLOAD } from '@/lib/constants';

/**
 * Validierungsschema für Datei-Uploads
 */
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File, { message: 'Bitte wähle eine Datei aus' })
    .refine(
      (file) => file.size <= FILE_UPLOAD.maxSizeBytes,
      `Die Datei ist zu groß. Maximal ${FILE_UPLOAD.maxSizeMB} MB erlaubt.`
    )
    .refine(
      (file) => FILE_UPLOAD.allowedMimeTypes.includes(file.type as never),
      'Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.'
    )
    .refine(
      (file) => !file.name.includes('..'),
      'Ungültiger Dateiname.'
    )
    .refine(
      (file) => /^[\w\-. äöüÄÖÜß]+$/i.test(file.name),
      'Dateiname enthält ungültige Zeichen.'
    ),
});

export type FileUploadFormData = z.infer<typeof fileUploadSchema>;

/**
 * Validierungsschema für Dokument-Upload
 */
export const documentUploadSchema = z.object({
  vehicle_id: z
    .string({
      required_error: 'Fahrzeug ist erforderlich',
    })
    .uuid('Ungültige Fahrzeug-ID'),

  document_type_id: z
    .string({
      required_error: 'Dokumenttyp ist erforderlich',
    })
    .uuid('Ungültige Dokumenttyp-ID'),

  name: z
    .string()
    .min(1, 'Dateiname ist erforderlich')
    .max(255, 'Dateiname darf maximal 255 Zeichen haben'),

  notes: z
    .string()
    .max(2000, 'Notizen dürfen maximal 2000 Zeichen haben')
    .nullish(),
});

export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

/**
 * Validierungsschema für Dokumenttypen
 */
export const documentTypeSchema = z.object({
  name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen haben')
    .max(100, 'Name darf maximal 100 Zeichen haben'),

  description: z
    .string()
    .max(500, 'Beschreibung darf maximal 500 Zeichen haben')
    .nullish(),
});

export type DocumentTypeFormData = z.infer<typeof documentTypeSchema>;
