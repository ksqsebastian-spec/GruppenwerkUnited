import { createAdminClient } from '@/lib/supabase/admin';
import type { MarkitdownTemplate, MarkitdownTemplateInsert } from '@/types';

export interface TemplateFilter {
  /** Bild muss MINDESTENS einen der Tags besitzen. */
  tags?: string[];
  /** Volltextsuche über Titel, Beschreibung, Markdown und Uploader. */
  search?: string;
}

export async function fetchTemplates(filter: TemplateFilter = {}): Promise<MarkitdownTemplate[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('markitdown_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter.tags && filter.tags.length > 0) {
    query = query.overlaps('tags', filter.tags);
  }
  if (filter.search) {
    const clean = filter.search.replace(/[%,()\\]/g, ' ').trim();
    if (clean.length > 0) {
      const s = `%${clean}%`;
      query = query.or(
        `titel.ilike.${s},beschreibung.ilike.${s},markdown.ilike.${s},saved_by.ilike.${s}`,
      );
    }
  }

  const { data, error } = await query;
  if (error) throw new Error('Vorlagen konnten nicht geladen werden');
  return (data ?? []) as MarkitdownTemplate[];
}

export async function fetchTemplate(id: string): Promise<MarkitdownTemplate | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('markitdown_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('Vorlage konnte nicht geladen werden');
  return (data as MarkitdownTemplate | null) ?? null;
}

export async function createTemplate(
  savedByCompany: string,
  input: MarkitdownTemplateInsert,
): Promise<MarkitdownTemplate> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('markitdown_templates')
    .insert({
      titel: input.titel,
      beschreibung: input.beschreibung ?? null,
      tags: input.tags,
      markdown: input.markdown,
      source_dateiname: input.source_dateiname ?? null,
      source_dateityp: input.source_dateityp ?? null,
      saved_by: input.saved_by,
      saved_by_company: savedByCompany,
    })
    .select()
    .single();
  if (error) throw new Error('Vorlage konnte nicht gespeichert werden');
  return data as MarkitdownTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('markitdown_templates').delete().eq('id', id);
  if (error) throw new Error('Vorlage konnte nicht gelöscht werden');
}

/**
 * Eindeutige Tag-Werte aller Vorlagen (für Autocomplete und Filter-Chips).
 * Sortiert nach Häufigkeit absteigend, danach alphabetisch.
 */
export async function fetchAllTags(): Promise<Array<{ tag: string; count: number }>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('markitdown_templates')
    .select('tags');
  if (error) throw new Error('Tags konnten nicht geladen werden');

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as Array<{ tags: string[] | null }>) {
    for (const t of row.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
