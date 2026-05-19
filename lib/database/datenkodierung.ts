import { supabase } from '@/lib/supabase/client';
import { generateCode } from '@/lib/datenkodierung/code-generator';
import { ERROR_MESSAGES } from '@/lib/errors/messages';
import type { Datenkodierung, DatenkodierungInsert } from '@/types';

export async function fetchAllTags(companyId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('datenkodierungen')
    .select('tags')
    .eq('company', companyId);

  if (error) return [];

  const all = (data ?? []).flatMap((row) => row.tags ?? []);
  return [...new Set(all)].sort();
}

export async function fetchDatenkodierungen(companyId: string, search?: string, tag?: string): Promise<Datenkodierung[]> {
  let query = supabase
    .from('datenkodierungen')
    .select('*')
    .eq('company', companyId)
    .order('created_at', { ascending: false });

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    query = query.or(`code.ilike.${term},name.ilike.${term},adresse.ilike.${term}`);
  }

  if (tag && tag.trim().length > 0) {
    query = query.contains('tags', [tag.trim()]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Datenkodierungen:', error);
    throw new Error(`[${error.code}] ${error.message}`);
  }

  return data ?? [];
}

export async function createDatenkodierung(companyId: string, input: DatenkodierungInsert): Promise<Datenkodierung> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();

    const { data, error } = await supabase
      .from('datenkodierungen')
      .insert({ ...input, code, company: companyId, tags: input.tags ?? [] })
      .select()
      .single();

    if (!error) {
      return data;
    }

    if (error.code !== '23505') {
      console.error('Fehler beim Kodieren des Datensatzes:', error);
      throw new Error(ERROR_MESSAGES.KODIERUNG_CREATE_FAILED);
    }
  }

  throw new Error(ERROR_MESSAGES.KODIERUNG_CREATE_FAILED);
}

export async function updateDatenkodierungTags(companyId: string, id: string, tags: string[]): Promise<Datenkodierung> {
  const { data, error } = await supabase
    .from('datenkodierungen')
    .update({ tags })
    .eq('id', id)
    .eq('company', companyId)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren der Tags:', error);
    throw new Error('Tags konnten nicht gespeichert werden');
  }

  return data;
}

export async function deleteDatenkodierung(companyId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('datenkodierungen')
    .delete()
    .eq('id', id)
    .eq('company', companyId);

  if (error) {
    console.error('Fehler beim Löschen der Datenkodierung:', error);
    throw new Error(ERROR_MESSAGES.KODIERUNG_DELETE_FAILED);
  }
}
