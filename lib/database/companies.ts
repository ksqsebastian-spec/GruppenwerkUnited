import { supabase } from '@/lib/supabase/client';
import type { Company, CompanyInsert, CompanyUpdate } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

/**
 * Lädt alle Firmen
 */
export async function fetchCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name');

  if (error) {
    console.error('Fehler beim Laden der Firmen:', error);
    throw new Error(ERROR_MESSAGES.COMPANY_LOAD_FAILED);
  }

  return data ?? [];
}

/**
 * Erstellt eine neue Firma
 */
export async function createCompany(company: CompanyInsert): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .insert(company)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen der Firma:', error);
    throw new Error(ERROR_MESSAGES.COMPANY_CREATE_FAILED);
  }

  return data;
}

/**
 * Aktualisiert eine Firma
 */
export async function updateCompany(id: string, updates: CompanyUpdate): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren der Firma:', error);
    throw new Error(ERROR_MESSAGES.COMPANY_UPDATE_FAILED);
  }

  return data;
}

/**
 * Löscht eine Firma
 */
export async function deleteCompany(id: string): Promise<void> {
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
