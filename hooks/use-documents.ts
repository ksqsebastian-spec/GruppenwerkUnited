import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { useAuth } from '@/components/providers/auth-provider';
import type { Document, DocumentInsert, DocumentType, DocumentEntityType, DocumentFilters, DocumentSortField, SortDirection } from '@/types';

/**
 * Parameter für Entity-basierte Dokumentabfragen
 */
interface EntityDocumentParams {
  entityType: DocumentEntityType;
  entityId: string;
}

/**
 * Lädt alle Dokumenttypen aus der Datenbank
 */
async function fetchDocumentTypes(): Promise<DocumentType[]> {
  const { data, error } = await supabase
    .from('document_types')
    .select('*')
    .order('name');

  if (error) {
    console.error('Fehler beim Laden der Dokumenttypen:', error);
    throw new Error('Dokumenttypen konnten nicht geladen werden');
  }

  return (data ?? []) as DocumentType[];
}

/**
 * Ermittelt den korrekten Spaltennamen für die Entity-ID
 */
function getEntityIdColumn(entityType: DocumentEntityType): string {
  switch (entityType) {
    case 'vehicle':
      return 'vehicle_id';
    case 'damage':
      return 'damage_id';
    case 'appointment':
      return 'appointment_id';
    case 'driver':
      return 'driver_id';
    case 'license_check_employee':
      return 'license_check_employee_id';
    case 'license_check':
      return 'license_check_id';
    case 'uvv_check':
      return 'uvv_check_id';
  }
}

/**
 * Lädt alle Dokumente mit Entity-Filter
 */
async function fetchDocuments(params?: EntityDocumentParams): Promise<Document[]> {
  let query = supabase
    .from('documents')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      damage:damages(id, description, date),
      appointment:appointments(id, due_date),
      driver:drivers(id, first_name, last_name),
      license_check_employee:license_check_employees(id, first_name, last_name),
      license_check:license_checks(id, check_date, employee_id),
      document_type:document_types(*)
    `)
    .order('uploaded_at', { ascending: false });

  if (params) {
    const column = getEntityIdColumn(params.entityType);
    query = query.eq(column, params.entityId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Dokumente:', error);
    throw new Error('Dokumente konnten nicht geladen werden');
  }

  return (data ?? []) as Document[];
}

/**
 * Lädt ein einzelnes Dokument
 */
async function fetchDocument(id: string): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      vehicle:vehicles(*),
      damage:damages(*),
      appointment:appointments(*),
      driver:drivers(*),
      license_check_employee:license_check_employees(*),
      license_check:license_checks(*, employee:license_check_employees(id, first_name, last_name)),
      document_type:document_types(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Fehler beim Laden des Dokuments:', error);
    throw new Error('Dokument konnte nicht geladen werden');
  }

  return data as Document;
}

/**
 * Lädt eine Datei in Supabase Storage hoch
 * Organisiert Dateien nach Entity-Typ: {entityType}s/{entityId}/{timestamp}.{ext}
 */
async function uploadFile(
  file: File,
  entityType: DocumentEntityType,
  entityId: string
): Promise<{ path: string; size: number; type: string }> {
  const fileExt = file.name.split('.').pop();
  // Pfad: vehicles/uuid/timestamp.pdf oder damages/uuid/timestamp.pdf
  const fileName = `${entityType}s/${entityId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Fehler beim Hochladen:', uploadError);
    throw new Error('Datei konnte nicht hochgeladen werden');
  }

  return {
    path: fileName,
    size: file.size,
    type: file.type,
  };
}

/**
 * Parameter für Dokument-Erstellung
 */
interface CreateDocumentParams {
  entityType: DocumentEntityType;
  entityId: string;
  document_type_id: string;
  name: string;
  notes?: string | null;
  file: File;
}

/**
 * Erstellt einen neuen Dokumenteintrag
 */
async function createDocument(params: CreateDocumentParams): Promise<Document> {
  const { entityType, entityId, document_type_id, name, notes, file } = params;

  // Datei hochladen
  const uploadResult = await uploadFile(file, entityType, entityId);

  // Insert-Daten vorbereiten
  const insertData: Record<string, unknown> = {
    entity_type: entityType,
    document_type_id,
    name,
    file_path: uploadResult.path,
    file_size: uploadResult.size,
    mime_type: uploadResult.type,
    notes: notes || null,
    // Alle Entity-IDs auf null setzen
    vehicle_id: null,
    damage_id: null,
    appointment_id: null,
    driver_id: null,
    license_check_employee_id: null,
    license_check_id: null,
    uvv_check_id: null,
  };

  // Die richtige Entity-ID setzen
  const idColumn = getEntityIdColumn(entityType);
  insertData[idColumn] = entityId;

  // Dokumenteintrag erstellen
  const { data: document, error } = await supabase
    .from('documents')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen des Dokuments:', error);
    console.error('Insert-Daten:', JSON.stringify(insertData, null, 2));
    // Detailliertere Fehlermeldung für Debugging
    throw new Error(`Dokument konnte nicht erstellt werden: ${error.message || error.code || 'Unbekannter Fehler'}`);
  }

  return document as Document;
}

/**
 * Löscht ein Dokument
 */
async function deleteDocument(id: string): Promise<void> {
  // Erst das Dokument laden um den Dateipfad zu bekommen
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Fehler beim Laden des Dokuments:', fetchError);
    throw new Error('Dokument konnte nicht gelöscht werden');
  }

  // Datei aus Storage löschen
  if (doc?.file_path) {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.file_path]);

    if (storageError) {
      console.error('Fehler beim Löschen der Datei:', storageError);
      // Fehler loggen aber fortfahren
    }
  }

  // Dokumenteintrag löschen
  const { error } = await supabase.from('documents').delete().eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen des Dokuments:', error);
    throw new Error('Dokument konnte nicht gelöscht werden');
  }
}

/**
 * Lädt alle Dokumente mit erweiterten Filtern für die Datenablage
 */
async function fetchAllDocuments(filters?: DocumentFilters): Promise<Document[]> {
  let query = supabase
    .from('documents')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      damage:damages(id, description, date),
      appointment:appointments(id, due_date),
      driver:drivers(id, first_name, last_name),
      license_check_employee:license_check_employees(id, first_name, last_name),
      license_check:license_checks(id, check_date, employee_id),
      document_type:document_types(*)
    `)
    .order('uploaded_at', { ascending: false });

  // Filter nach Entity-Typ
  if (filters?.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }

  // Filter nach Dokumenttyp
  if (filters?.documentTypeId) {
    query = query.eq('document_type_id', filters.documentTypeId);
  }

  // Filter nach Fahrzeug
  if (filters?.vehicleId) {
    query = query.eq('vehicle_id', filters.vehicleId);
  }

  // Filter nach Datum (von)
  if (filters?.dateFrom) {
    query = query.gte('uploaded_at', filters.dateFrom);
  }

  // Filter nach Datum (bis)
  if (filters?.dateTo) {
    query = query.lte('uploaded_at', filters.dateTo + 'T23:59:59');
  }

  // Filter nach Dateityp
  if (filters?.fileType && filters.fileType !== 'all') {
    if (filters.fileType === 'pdf') {
      query = query.eq('mime_type', 'application/pdf');
    } else if (filters.fileType === 'image') {
      query = query.or('mime_type.eq.image/jpeg,mime_type.eq.image/png,mime_type.eq.image/webp');
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Dokumente:', error);
    throw new Error('Dokumente konnten nicht geladen werden');
  }

  // Client-seitige Textsuche (für bessere Performance bei Volltextsuche)
  let results = (data ?? []) as Document[];

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter((doc) => {
      // Suche in Dokumentname
      if (doc.name.toLowerCase().includes(searchLower)) return true;
      // Suche in Notizen
      if (doc.notes?.toLowerCase().includes(searchLower)) return true;
      // Suche in Fahrzeugkennzeichen
      if (doc.vehicle?.license_plate?.toLowerCase().includes(searchLower)) return true;
      // Suche in Fahrername
      if (doc.driver) {
        const fullName = `${doc.driver.first_name} ${doc.driver.last_name}`.toLowerCase();
        if (fullName.includes(searchLower)) return true;
      }
      // Suche in Führerscheinkontrolle-Mitarbeitername
      if (doc.license_check_employee) {
        const fullName = `${doc.license_check_employee.first_name} ${doc.license_check_employee.last_name}`.toLowerCase();
        if (fullName.includes(searchLower)) return true;
      }
      return false;
    });
  }

  return results;
}

/**
 * Erstellt eine signierte URL für ein Dokument (für private Buckets)
 */
export async function getDocumentUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600); // 1 Stunde gültig

  if (error) {
    console.error('Fehler beim Erstellen der Dokument-URL:', error);
    throw new Error('Dokument-URL konnte nicht erstellt werden');
  }

  return data.signedUrl;
}

/**
 * Hook für alle Dokumenttypen
 */
export function useDocumentTypes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['document-types'],
    queryFn: fetchDocumentTypes,
    staleTime: 30 * 60 * 1000, // 30 Minuten - Typen ändern sich selten
    enabled: !!user,
  });
}

/**
 * Hook für Dokumente einer Entity
 * @param entityType - Typ der Entity (vehicle, damage, appointment, driver)
 * @param entityId - ID der Entity
 */
export function useDocuments(entityType?: DocumentEntityType, entityId?: string) {
  const { user } = useAuth();

  const params = entityType && entityId ? { entityType, entityId } : undefined;

  return useQuery({
    queryKey: ['documents', entityType, entityId],
    queryFn: () => fetchDocuments(params),
    staleTime: QUERY_STALE_TIMES.documents,
    enabled: !!user,
  });
}

/**
 * Hook für alle Dokumente mit erweiterten Filtern (für Datenablage)
 */
export function useAllDocuments(filters?: DocumentFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['documents', 'all', filters],
    queryFn: () => fetchAllDocuments(filters),
    staleTime: QUERY_STALE_TIMES.documents,
    enabled: !!user,
  });
}

/**
 * Hook für Fahrzeug-Dokumente (Rückwärtskompatibilität)
 */
export function useVehicleDocuments(vehicleId?: string) {
  return useDocuments(vehicleId ? 'vehicle' : undefined, vehicleId);
}

/**
 * Hook für Schadens-Dokumente
 */
export function useDamageDocuments(damageId?: string) {
  return useDocuments(damageId ? 'damage' : undefined, damageId);
}

/**
 * Hook für Termin-Dokumente
 */
export function useAppointmentDocuments(appointmentId?: string) {
  return useDocuments(appointmentId ? 'appointment' : undefined, appointmentId);
}

/**
 * Hook für Fahrer-Dokumente
 */
export function useDriverDocuments(driverId?: string) {
  return useDocuments(driverId ? 'driver' : undefined, driverId);
}

/**
 * Hook für Führerscheinkontrolle-Mitarbeiter-Dokumente
 */
export function useLicenseEmployeeDocuments(employeeId?: string) {
  return useDocuments(employeeId ? 'license_check_employee' : undefined, employeeId);
}

/**
 * Hook für Führerscheinkontrolle-Dokumente (einzelne Kontrolle)
 */
export function useLicenseCheckDocuments(checkId?: string) {
  return useDocuments(checkId ? 'license_check' : undefined, checkId);
}

/**
 * Hook für ein einzelnes Dokument
 */
export function useDocument(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['document', id],
    queryFn: () => fetchDocument(id!),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.documents,
  });
}

/**
 * Hook zum Hochladen eines Dokuments
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateDocumentParams) => createDocument(params),
    onSuccess: (_, variables) => {
      // Alle relevanten Queries invalidieren
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.entityType, variables.entityId]
      });
      toast.success('Dokument erfolgreich hochgeladen');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Löschen eines Dokuments
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Dokument erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
