import { supabase } from '@/lib/supabase/client';
import { generateCode } from '@/lib/datenkodierung/code-generator';
import { ERROR_MESSAGES } from '@/lib/errors/messages';
import type { Datenkodierung, DatenkodierungInsert } from '@/types';

export async function fetchDatenkodierungen(search?: string): Promise<Datenkodierung[]> {
  let query = supabase
    .from('datenkodierungen')
    .select('*')
    .order('created_at', { ascending: false });

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    query = query.or(`code.ilike.${term},name.ilike.${term},adresse.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Datenkodierungen:', error);
    throw new Error(`[${error.code}] ${error.message}`);
  }

  return data ?? [];
}

export async function createDatenkodierung(input: DatenkodierungInsert): Promise<Datenkodierung> {
  // Bei Kollision max. 3 Versuche
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();

    const { data, error } = await supabase
      .from('datenkodierungen')
      .insert({ ...input, code })
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

export async function deleteDatenkodierung(id: string): Promise<void> {
  const { error } = await supabase.from('datenkodierungen').delete().eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen der Datenkodierung:', error);
    throw new Error(ERROR_MESSAGES.KODIERUNG_DELETE_FAILED);
  }
}
