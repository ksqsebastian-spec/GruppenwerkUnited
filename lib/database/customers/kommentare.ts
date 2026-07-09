import { createAdminClient } from '@/lib/supabase/admin';
import type { CustomerKommentar } from '@/types';

// ── Kommentare ───────────────────────────────────────────────────────────────

export async function fetchKommentare(
  customerId: string,
  companyId: string,
): Promise<CustomerKommentar[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customer_kommentare')
    .select('*')
    .eq('customer_id', customerId)
    .eq('company', companyId)
    .order('created_at', { ascending: true });
  if (error) throw new Error('Kommentare konnten nicht geladen werden');
  return (data ?? []) as CustomerKommentar[];
}

export async function createKommentar(
  customerId: string,
  companyId: string,
  text: string,
): Promise<CustomerKommentar> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customer_kommentare')
    .insert({ customer_id: customerId, company: companyId, text })
    .select()
    .single();
  if (error) throw new Error('Kommentar konnte nicht gespeichert werden');
  return data as CustomerKommentar;
}

export async function deleteKommentar(id: string, companyId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('customer_kommentare')
    .delete()
    .eq('id', id)
    .eq('company', companyId);
  if (error) throw new Error('Kommentar konnte nicht gelöscht werden');
}
