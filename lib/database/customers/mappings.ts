import { createAdminClient } from '@/lib/supabase/admin';
import type { CustomerMapping, CustomerMappingEintrag } from '@/types';

// ── Gespeicherte Code-Mappings ───────────────────────────────────────────────

export async function fetchMappings(
  customerId: string,
  companyId: string,
): Promise<CustomerMapping[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customer_mappings')
    .select('*')
    .eq('customer_id', customerId)
    .eq('company', companyId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Mappings konnten nicht geladen werden');
  return (data ?? []) as CustomerMapping[];
}

export async function createMapping(
  customerId: string,
  companyId: string,
  anlass: string,
  eintraege: CustomerMappingEintrag[],
): Promise<CustomerMapping> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customer_mappings')
    .insert({ customer_id: customerId, company: companyId, anlass, eintraege })
    .select()
    .single();
  if (error) throw new Error('Mapping konnte nicht gespeichert werden');
  return data as CustomerMapping;
}

export async function deleteMapping(id: string, companyId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('customer_mappings')
    .delete()
    .eq('id', id)
    .eq('company', companyId);
  if (error) throw new Error('Mapping konnte nicht gelöscht werden');
}
