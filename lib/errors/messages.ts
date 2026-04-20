/**
 * Zentrale deutsche Fehlermeldungen für die Fuhrpark Management App
 */
export const ERROR_MESSAGES = {
  // Allgemein
  UNKNOWN: 'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.',
  NETWORK: 'Keine Internetverbindung. Bitte prüfe dein Netzwerk.',
  UNAUTHORIZED: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
  FORBIDDEN: 'Du hast keine Berechtigung für diese Aktion.',
  NOT_FOUND: 'Die angeforderte Ressource wurde nicht gefunden.',
  VALIDATION_FAILED: 'Bitte überprüfe deine Eingaben.',

  // Authentifizierung
  AUTH_INVALID_CREDENTIALS: 'Anmeldung fehlgeschlagen. Bitte prüfe E-Mail und Passwort.',
  AUTH_SESSION_EXPIRED: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
  AUTH_SIGN_OUT_FAILED: 'Abmelden fehlgeschlagen. Bitte versuche es erneut.',

  // Fahrzeuge
  VEHICLE_NOT_FOUND: 'Fahrzeug nicht gefunden.',
  VEHICLE_CREATE_FAILED: 'Fahrzeug konnte nicht angelegt werden.',
  VEHICLE_UPDATE_FAILED: 'Fahrzeug konnte nicht aktualisiert werden.',
  VEHICLE_DELETE_FAILED: 'Fahrzeug konnte nicht gelöscht werden.',
  VEHICLE_ARCHIVE_FAILED: 'Fahrzeug konnte nicht archiviert werden.',
  VEHICLE_DUPLICATE_PLATE: 'Ein Fahrzeug mit diesem Kennzeichen existiert bereits.',
  VEHICLE_LOAD_FAILED: 'Fahrzeuge konnten nicht geladen werden.',

  // Fahrer
  DRIVER_NOT_FOUND: 'Fahrer nicht gefunden.',
  DRIVER_CREATE_FAILED: 'Fahrer konnte nicht angelegt werden.',
  DRIVER_UPDATE_FAILED: 'Fahrer konnte nicht aktualisiert werden.',
  DRIVER_DELETE_FAILED: 'Fahrer konnte nicht gelöscht werden.',
  DRIVER_LOAD_FAILED: 'Fahrer konnten nicht geladen werden.',

  // Fahrer-Fahrzeug-Zuweisungen
  VEHICLE_DRIVER_LOAD_FAILED: 'Zuweisungen konnten nicht geladen werden.',
  VEHICLE_DRIVER_ASSIGN_FAILED: 'Fahrer konnte nicht zugewiesen werden.',
  VEHICLE_DRIVER_UNASSIGN_FAILED: 'Zuweisung konnte nicht entfernt werden.',
  VEHICLE_DRIVER_UPDATE_FAILED: 'Zuweisung konnte nicht aktualisiert werden.',
  VEHICLE_DRIVER_ALREADY_ASSIGNED: 'Dieser Fahrer ist dem Fahrzeug bereits zugewiesen.',

  // Termine
  APPOINTMENT_NOT_FOUND: 'Termin nicht gefunden.',
  APPOINTMENT_CREATE_FAILED: 'Termin konnte nicht angelegt werden.',
  APPOINTMENT_UPDATE_FAILED: 'Termin konnte nicht aktualisiert werden.',
  APPOINTMENT_DELETE_FAILED: 'Termin konnte nicht gelöscht werden.',
  APPOINTMENT_COMPLETE_FAILED: 'Termin konnte nicht als erledigt markiert werden.',
  APPOINTMENT_LOAD_FAILED: 'Termine konnten nicht geladen werden.',

  // Schäden
  DAMAGE_NOT_FOUND: 'Schaden nicht gefunden.',
  DAMAGE_CREATE_FAILED: 'Schaden konnte nicht gemeldet werden.',
  DAMAGE_UPDATE_FAILED: 'Schaden konnte nicht aktualisiert werden.',
  DAMAGE_DELETE_FAILED: 'Schaden konnte nicht gelöscht werden.',
  DAMAGE_STATUS_UPDATE_FAILED: 'Schadensstatus konnte nicht aktualisiert werden.',
  DAMAGE_LOAD_FAILED: 'Schäden konnten nicht geladen werden.',

  // Kosten
  COST_NOT_FOUND: 'Kosteneintrag nicht gefunden.',
  COST_CREATE_FAILED: 'Kosten konnten nicht erfasst werden.',
  COST_UPDATE_FAILED: 'Kosten konnten nicht aktualisiert werden.',
  COST_DELETE_FAILED: 'Kosten konnten nicht gelöscht werden.',
  COST_LOAD_FAILED: 'Kosten konnten nicht geladen werden.',

  // Dokumente
  DOCUMENT_NOT_FOUND: 'Dokument nicht gefunden.',
  DOCUMENT_UPLOAD_FAILED: 'Dokument konnte nicht hochgeladen werden.',
  DOCUMENT_DELETE_FAILED: 'Dokument konnte nicht gelöscht werden.',
  DOCUMENT_LOAD_FAILED: 'Dokumente konnten nicht geladen werden.',
  DOCUMENT_DOWNLOAD_FAILED: 'Dokument konnte nicht heruntergeladen werden.',

  // Uploads
  FILE_TOO_LARGE: 'Die Datei ist zu groß. Maximal 10 MB erlaubt.',
  FILE_INVALID_TYPE: 'Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.',
  FILE_UPLOAD_FAILED: 'Datei konnte nicht hochgeladen werden.',
  FILE_NAME_INVALID: 'Ungültiger Dateiname.',

  // Firmen
  COMPANY_NOT_FOUND: 'Firma nicht gefunden.',
  COMPANY_CREATE_FAILED: 'Firma konnte nicht angelegt werden.',
  COMPANY_UPDATE_FAILED: 'Firma konnte nicht aktualisiert werden.',
  COMPANY_DELETE_FAILED: 'Firma konnte nicht gelöscht werden.',
  COMPANY_LOAD_FAILED: 'Firmen konnten nicht geladen werden.',
  COMPANY_IN_USE: 'Firma kann nicht gelöscht werden, da sie noch verwendet wird.',

  // CSV Import/Export
  CSV_EXPORT_FAILED: 'CSV-Export fehlgeschlagen.',
  CSV_IMPORT_FAILED: 'CSV-Import fehlgeschlagen.',
  CSV_INVALID_FORMAT: 'Ungültiges CSV-Format.',
  CSV_MISSING_COLUMNS: 'Erforderliche Spalten fehlen.',

  // Führerscheinkontrolle - Mitarbeiter
  LICENSE_EMPLOYEE_NOT_FOUND: 'Mitarbeiter nicht gefunden.',
  LICENSE_EMPLOYEE_CREATE_FAILED: 'Mitarbeiter konnte nicht angelegt werden.',
  LICENSE_EMPLOYEE_UPDATE_FAILED: 'Mitarbeiter konnte nicht aktualisiert werden.',
  LICENSE_EMPLOYEE_DELETE_FAILED: 'Mitarbeiter konnte nicht gelöscht werden.',
  LICENSE_EMPLOYEE_ARCHIVE_FAILED: 'Mitarbeiter konnte nicht archiviert werden.',
  LICENSE_EMPLOYEE_LOAD_FAILED: 'Mitarbeiter konnten nicht geladen werden.',

  // Führerscheinkontrolle - Kontrollen
  LICENSE_CHECK_CREATE_FAILED: 'Kontrolle konnte nicht gespeichert werden.',
  LICENSE_CHECK_DELETE_FAILED: 'Kontrolle konnte nicht gelöscht werden.',
  LICENSE_CHECK_LOAD_FAILED: 'Kontrollen konnten nicht geladen werden.',

  // Führerscheinkontrolle - Prüfer
  LICENSE_INSPECTOR_NOT_FOUND: 'Prüfer nicht gefunden.',
  LICENSE_INSPECTOR_CREATE_FAILED: 'Prüfer konnte nicht angelegt werden.',
  LICENSE_INSPECTOR_UPDATE_FAILED: 'Prüfer konnte nicht aktualisiert werden.',
  LICENSE_INSPECTOR_DELETE_FAILED: 'Prüfer konnte nicht gelöscht werden.',
  LICENSE_INSPECTOR_LOAD_FAILED: 'Prüfer konnten nicht geladen werden.',
  LICENSE_INSPECTOR_IN_USE: 'Prüfer kann nicht gelöscht werden, da er noch für Kontrollen verwendet wird.',

  // Führerscheinkontrolle - Einstellungen
  LICENSE_SETTINGS_LOAD_FAILED: 'Einstellungen konnten nicht geladen werden.',
  LICENSE_SETTINGS_UPDATE_FAILED: 'Einstellungen konnten nicht aktualisiert werden.',

  // UVV-Kontrolle - Einstellungen
  UVV_SETTINGS_LOAD_FAILED: 'UVV-Einstellungen konnten nicht geladen werden.',
  UVV_SETTINGS_UPDATE_FAILED: 'UVV-Einstellungen konnten nicht aktualisiert werden.',

  // UVV-Kontrolle - Unterweisende
  UVV_INSTRUCTOR_NOT_FOUND: 'Unterweisender nicht gefunden.',
  UVV_INSTRUCTOR_CREATE_FAILED: 'Unterweisender konnte nicht angelegt werden.',
  UVV_INSTRUCTOR_UPDATE_FAILED: 'Unterweisender konnte nicht aktualisiert werden.',
  UVV_INSTRUCTOR_DELETE_FAILED: 'Unterweisender konnte nicht archiviert werden.',
  UVV_INSTRUCTOR_LOAD_FAILED: 'Unterweisende konnten nicht geladen werden.',
  UVV_INSTRUCTOR_IN_USE: 'Unterweisender kann nicht gelöscht werden, da er noch für Unterweisungen verwendet wird.',

  // UVV-Kontrolle - Unterweisungen
  UVV_CHECK_CREATE_FAILED: 'Unterweisung konnte nicht gespeichert werden.',
  UVV_CHECK_DELETE_FAILED: 'Unterweisung konnte nicht gelöscht werden.',
  UVV_CHECK_LOAD_FAILED: 'Unterweisungen konnten nicht geladen werden.',

  // UVV-Kontrolle - PDF
  UVV_PDF_GENERATION_FAILED: 'PDF konnte nicht erstellt werden.',

  // Datenkodierung
  KODIERUNG_NOT_FOUND: 'Datensatz nicht gefunden.',
  KODIERUNG_CREATE_FAILED: 'Datensatz konnte nicht kodiert werden.',
  KODIERUNG_DELETE_FAILED: 'Datensatz konnte nicht gelöscht werden.',
  KODIERUNG_LOAD_FAILED: 'Datensätze konnten nicht geladen werden.',
  KODIERUNG_DUPLICATE_CODE: 'Dieser Code existiert bereits.',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
