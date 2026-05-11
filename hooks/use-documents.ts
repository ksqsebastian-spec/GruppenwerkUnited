import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { useAuth } from '@/components/providers/auth-provider';
import type { Document, DocumentType, DocumentEntityType, DocumentFilters } from '@/types';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Fehler bei der Anfrage');
  }
  return res.json() as Promise<T>;
}

function buildDocumentParams(entityType?: DocumentEntityType, entityId?: string, filters?: DocumentFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (entityType && entityId) {
    const colMap: Record<DocumentEntityType, string> = {
      vehicle: 'vehicleId',
      damage: 'damageId',
      appointment: 'appointmentId',
      driver: 'driverId',
      license_check_employee: 'licenseCheckEmployeeId',
      license_check: 'licenseCheckId',
      uvv_check: 'uvvCheckId',
    };
    params.set(colMap[entityType], entityId);
  }
  if (filters?.entityType) params.set('entityType', filters.entityType);
  if (filters?.documentTypeId) params.set('documentTypeId', filters.documentTypeId);
  if (filters?.vehicleId) params.set('vehicleId', filters.vehicleId);
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);
  return params;
}

export function useDocumentTypes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['document-types'],
    queryFn: () => apiFetch<DocumentType[]>('/api/fuhrpark/document-types'),
    staleTime: 30 * 60 * 1000,
    enabled: !!user,
  });
}

export function useDocuments(entityType?: DocumentEntityType, entityId?: string) {
  const { user } = useAuth();
  const params = buildDocumentParams(entityType, entityId);

  return useQuery({
    queryKey: ['documents', entityType, entityId],
    queryFn: () => apiFetch<Document[]>(`/api/fuhrpark/documents?${params}`),
    staleTime: QUERY_STALE_TIMES.documents,
    enabled: !!user,
  });
}

export function useAllDocuments(filters?: DocumentFilters) {
  const { user } = useAuth();
  const params = buildDocumentParams(undefined, undefined, filters);

  return useQuery({
    queryKey: ['documents', 'all', filters],
    queryFn: () => apiFetch<Document[]>(`/api/fuhrpark/documents?${params}`),
    staleTime: QUERY_STALE_TIMES.documents,
    enabled: !!user,
  });
}

export function useVehicleDocuments(vehicleId?: string) {
  return useDocuments(vehicleId ? 'vehicle' : undefined, vehicleId);
}

export function useDamageDocuments(damageId?: string) {
  return useDocuments(damageId ? 'damage' : undefined, damageId);
}

export function useAppointmentDocuments(appointmentId?: string) {
  return useDocuments(appointmentId ? 'appointment' : undefined, appointmentId);
}

export function useDriverDocuments(driverId?: string) {
  return useDocuments(driverId ? 'driver' : undefined, driverId);
}

export function useLicenseEmployeeDocuments(employeeId?: string) {
  return useDocuments(employeeId ? 'license_check_employee' : undefined, employeeId);
}

export function useLicenseCheckDocuments(checkId?: string) {
  return useDocuments(checkId ? 'license_check' : undefined, checkId);
}

export function useDocument(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => apiFetch<Document>(`/api/fuhrpark/documents/${id}`),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.documents,
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/fuhrpark/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Dokument erfolgreich gelöscht');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_params: unknown) => {
      toast.error('Datei-Upload ist auf Sevalla noch nicht verfügbar');
      return Promise.reject(new Error('Upload nicht verfügbar'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export async function getDocumentUrl(filePath: string): Promise<string> {
  return filePath;
}
