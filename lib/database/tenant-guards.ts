import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Stellt sicher, dass ein Fahrzeug zum angegebenen Mandanten (Tenant) gehört.
 *
 * Wird von mandantengebundenen Tabellen ohne eigenes company_id verwendet
 * (appointments, costs, damages, vehicle_drivers), deren Tenant-Scope über
 * vehicle.company_id läuft. Wirft, wenn das Fahrzeug nicht zum Tenant gehört.
 */
export async function assertVehicleBelongsToTenant(vehicleId: string, tenantCompanyId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('company_id', tenantCompanyId)
    .maybeSingle();
  if (!data) throw new Error('Fahrzeug nicht gefunden');
}
