import { createAdminClient } from '@/lib/supabase/admin';
import type { Customer, CustomerInsert, CustomerUpdate } from '@/types';

// ── Kunden ────────────────────────────────────────────────────────────────────

export async function fetchCustomers(companyId: string): Promise<Customer[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company', companyId)
    .order('firmenname', { ascending: true });
  if (error) throw new Error('Kunden konnten nicht geladen werden');
  return (data ?? []) as Customer[];
}

export async function fetchCustomer(id: string, companyId: string): Promise<Customer | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('company', companyId)
    .maybeSingle();
  if (error) throw new Error('Kunde konnte nicht geladen werden');
  return (data as Customer | null) ?? null;
}

export async function createCustomer(
  companyId: string,
  input: CustomerInsert,
): Promise<Customer> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customers')
    .insert({ ...input, company: companyId })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('Ein Kunde mit diesem Firmennamen existiert bereits');
    }
    throw new Error('Kunde konnte nicht angelegt werden');
  }
  return data as Customer;
}

export async function updateCustomer(
  id: string,
  companyId: string,
  updates: CustomerUpdate,
): Promise<Customer> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .eq('company', companyId)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('Ein Kunde mit diesem Firmennamen existiert bereits');
    }
    throw new Error('Kunde konnte nicht aktualisiert werden');
  }
  return data as Customer;
}

export async function deleteCustomer(id: string, companyId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('company', companyId);
  if (error) throw new Error('Kunde konnte nicht gelöscht werden');
}
