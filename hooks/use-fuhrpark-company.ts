import { useQuery } from '@tanstack/react-query';
import { getOrCreateFuhrparkCompany } from '@/lib/database/companies';
import { useAuth } from '@/components/providers/auth-provider';

interface FuhrparkCompanyResult {
  /** UUID der Fuhrpark-Firma, null für Admins (kein Filter) oder während des Ladens */
  companyId: string | null;
  isLoading: boolean;
}

/**
 * Löst die Fuhrpark-Firmen-UUID für den eingeloggten Mandanten auf.
 * Admins erhalten null → kein Firmenfilter, alle Daten sichtbar.
 * Andere Firmen erhalten ihre UUID und sehen nur eigene Daten.
 */
export function useFuhrparkCompanyId(): FuhrparkCompanyResult {
  const { company, isLoading: authLoading } = useAuth();

  const { data: companyId, isLoading: queryLoading } = useQuery({
    queryKey: ['fuhrpark-company-id', company?.companyId],
    queryFn: () => getOrCreateFuhrparkCompany(company!.companyName),
    enabled: !!company && !company.isAdmin,
    staleTime: 60 * 60 * 1000,
  });

  if (authLoading) return { companyId: null, isLoading: true };
  if (!company) return { companyId: null, isLoading: false };

  // Admins sehen alle Daten → kein Firmenfilter
  if (company.isAdmin) return { companyId: null, isLoading: false };

  return { companyId: companyId ?? null, isLoading: queryLoading };
}
