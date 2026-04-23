import { supabase } from '@/lib/supabase/client';
import type {
  AutomatisierungsKnoten,
  AutomatisierungsKnotenInsert,
  AutomatisierungsKnotenUpdate,
} from '@/types';

/**
 * Lädt alle aktiven Automatisierungsknoten einer Firma als flache Liste.
 * React Flow arbeitet mit flachen Arrays (Nodes + Edges getrennt), daher
 * wird hier kein Baum aufgebaut – das passiert in der Canvas-Komponente.
 */
export async function fetchAutomatisierungsknoten(
  companyId: string
): Promise<AutomatisierungsKnoten[]> {
  const { data, error } = await supabase
    .from('automation_nodes')
    .select('*')
    .eq('company', companyId)
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) {
    console.error('Fehler beim Laden der Automatisierungsknoten:', error);
    throw new Error('Automatisierungen konnten nicht geladen werden');
  }

  return (data ?? []) as AutomatisierungsKnoten[];
}

/**
 * Erstellt einen neuen Automatisierungsknoten.
 */
export async function createAutomatisierungsknoten(
  companyId: string,
  input: Omit<AutomatisierungsKnotenInsert, 'company'>
): Promise<AutomatisierungsKnoten> {
  const { data, error } = await supabase
    .from('automation_nodes')
    .insert({ ...input, company: companyId })
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen des Automatisierungsknotens:', error);
    throw new Error('Automatisierungsknoten konnte nicht erstellt werden');
  }

  return data as AutomatisierungsKnoten;
}

/**
 * Aktualisiert einen bestehenden Automatisierungsknoten.
 */
export async function updateAutomatisierungsknoten(
  companyId: string,
  id: string,
  updates: AutomatisierungsKnotenUpdate
): Promise<AutomatisierungsKnoten> {
  const { data, error } = await supabase
    .from('automation_nodes')
    .update(updates)
    .eq('id', id)
    .eq('company', companyId)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Automatisierungsknotens:', error);
    throw new Error('Automatisierungsknoten konnte nicht aktualisiert werden');
  }

  return data as AutomatisierungsKnoten;
}

/**
 * Speichert die Canvas-Position eines Knotens nach dem Drag.
 * Kein Toast — wird häufig aufgerufen, soll nicht stören.
 */
export async function updateKnotenPosition(
  id: string,
  x: number,
  y: number
): Promise<void> {
  const { error } = await supabase
    .from('automation_nodes')
    .update({ position_x: x, position_y: y })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Speichern der Knotenposition:', error);
  }
}

/**
 * Löscht einen Automatisierungsknoten.
 * Kinder werden kaskadierend durch die DB (ON DELETE CASCADE) entfernt.
 */
export async function deleteAutomatisierungsknoten(
  companyId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('automation_nodes')
    .delete()
    .eq('id', id)
    .eq('company', companyId);

  if (error) {
    console.error('Fehler beim Löschen des Automatisierungsknotens:', error);
    throw new Error('Automatisierungsknoten konnte nicht gelöscht werden');
  }
}
