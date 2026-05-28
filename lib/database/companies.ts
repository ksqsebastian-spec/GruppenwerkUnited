import { createAdminClient } from '@/lib/supabase/admin';
import type { Company, CompanyInsert, CompanyUpdate } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

const COMPANY_COLUMNS = 'id, name, created_at';

export async function fetchCompanies(): Promise<Company[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('companies')
    .select(COMPANY_COLUMNS)
    .order('name');

  if (error) {
    console.error('Fehler beim Laden der Firmen:', error);
    throw new Error(ERROR_MESSAGES.COMPANY_LOAD_FAILED);
  }

  return data ?? [];
}

export async function createCompany(company: CompanyInsert): Promise<Company> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('companies')
    .insert(company)
    .select(COMPANY_COLUMNS)
    .single();

  if (error) {
    console.error('Fehler beim Erstellen der Firma:', error);
    throw new Error(ERROR_MESSAGES.COMPANY_CREATE_FAILED);
  }

  return data;
}

export async function updateCompany(id: string, updates: CompanyUpdate): Promise<Company> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select(COMPANY_COLUMNS)
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren der Firma:', error);
    throw new Error(ERROR_MESSAGES.COMPANY_UPDATE_FAILED);
  }

  return data;
}

/**
 * Sucht eine Fuhrpark-Firma per Name oder legt sie neu an.
 * Gibt die UUID zurück. Wird beim ersten Zugriff eines neuen Mandanten aufgerufen.
 */
export async function getOrCreateFuhrparkCompany(name: string): Promise<string> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('companies')
    .insert({ name })
    .select('id')
    .single();

  if (error) {
    // Race condition: andere Anfrage hat die Firma gerade angelegt — erneut lesen
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from('companies')
        .select('id')
        .eq('name', name)
        .single();
      if (retry) return retry.id;
    }
    console.error('Fehler beim Anlegen der Fuhrpark-Firma:', error);
    throw new Error(ERROR_MESSAGES.COMPANY_CREATE_FAILED);
  }

  return data.id;
}

export async function deleteCompany(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) {
    if (error.code === '23503') {
      throw new Error(ERROR_MESSAGES.COMPANY_IN_USE);
    }
    console.error('Fehler beim Löschen der Firma:', error);
    throw new Error(ERROR_MESSAGES.COMPANY_DELETE_FAILED);
  }
}
