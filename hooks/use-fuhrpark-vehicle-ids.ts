import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { useFuhrparkCompanyId } from '@/hooks/use-fuhrpark-company';

interface FuhrparkVehicleIdsResult {
  /** Fahrzeug-IDs des Mandanten, null = kein Filter (Admin) oder noch am Laden */
  vehicleIds: string[] | null;
  isLoading: boolean;
}

/**
 * Gibt die Fahrzeug-IDs der aktuellen Mandanten-Firma zurück.
 * Admins erhalten null → kein Filter, alle Fahrzeuge sichtbar.
 * Andere Firmen erhalten die IDs ihrer eigenen Fahrzeuge.
 */
export function useFuhrparkVehicleIds(): FuhrparkVehicleIdsResult {
  const { company } = useAuth();
  const { companyId, isLoading: companyLoading } = useFuhrparkCompanyId();

  const { data: vehicleIds, isLoading: queryLoading } = useQuery({
    queryKey: ['fuhrpark-vehicle-ids', companyId],
    queryFn: async (): Promise<string[]> => {
      const { data } = await supabase
        .from('vehicles')
        .select('id')
        .eq('company_id', companyId!);
      return (data ?? []).map((v) => v.id);
    },
    enabled: !!companyId && !company?.isAdmin,
    staleTime: 5 * 60 * 1000, // 5 Minuten
  });

  if (!company) return { vehicleIds: null, isLoading: false };
  // Admins sehen alle Daten → kein Fahrzeugfilter
  if (company.isAdmin) return { vehicleIds: null, isLoading: false };
  if (companyLoading || queryLoading) return { vehicleIds: null, isLoading: true };

  return { vehicleIds: vehicleIds ?? [], isLoading: false };
}
