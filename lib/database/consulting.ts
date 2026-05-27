import { createAdminClient } from '@/lib/supabase/admin';
import type {
  ConsultingCompanyWithCounts,
  ConsultingCategoryWithCheckpoints,
  ConsultingCheckpointStatus,
  ConsultingCheckpointStatusUpdate,
  ConsultingCompanyInsert,
  ConsultingCompanyUpdate,
} from '@/types';

// ── Unternehmen ───────────────────────────────────────────────────────────────

export async function fetchConsultingCompanies(): Promise<ConsultingCompanyWithCounts[]> {
  const supabase = createAdminClient();

  const { data: companies, error: compErr } = await supabase
    .from('consulting_companies')
    .select('*')
    .order('sort_order');

  if (compErr) throw new Error('Unternehmen konnten nicht geladen werden: ' + compErr.message);

  const { data: statuses, error: statErr } = await supabase
    .from('consulting_checkpoint_status')
    .select('company_id, status, cost_monthly, updated_at');

  if (statErr) throw new Error('Status-Daten konnten nicht geladen werden: ' + statErr.message);

  return (companies ?? []).map((company) => {
    const rows = (statuses ?? []).filter((s) => s.company_id === company.id);
    const green_count = rows.filter((s) => s.status === 'green').length;
    const orange_count = rows.filter((s) => s.status === 'orange').length;
    const red_count = rows.filter((s) => s.status === 'red').length;
    const total_count = rows.length;
    const total_cost = rows.reduce((sum, s) => sum + (Number(s.cost_monthly) || 0), 0);
    const sorted = [...rows].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const last_updated = sorted[0]?.updated_at ?? null;

    return {
      ...company,
      green_count,
      orange_count,
      red_count,
      total_count,
      total_cost,
      last_updated,
    };
  });
}

export async function fetchConsultingCompanyBySlug(
  slug: string
): Promise<ConsultingCategoryWithCheckpoints[]> {
  const supabase = createAdminClient();

  const { data: company, error: compErr } = await supabase
    .from('consulting_companies')
    .select('id')
    .eq('slug', slug)
    .single();

  if (compErr || !company) throw new Error('Unternehmen nicht gefunden');

  const { data: categories, error: catErr } = await supabase
    .from('consulting_categories')
    .select('*, consulting_checkpoints(*, consulting_checkpoint_status(*))')
    .order('sort_order');

  if (catErr) throw new Error('Kategorien konnten nicht geladen werden: ' + catErr.message);

  return (categories ?? []).map((cat) => {
    const checkpoints = (cat.consulting_checkpoints ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((cp: { consulting_checkpoint_status?: ConsultingCheckpointStatus[]; [key: string]: unknown }) => {
        const status_row =
          (cp.consulting_checkpoint_status ?? []).find(
            (s: ConsultingCheckpointStatus) => s.company_id === company.id
          ) ?? null;
        const { consulting_checkpoint_status: _drop, ...checkpointFields } = cp;
        return { ...checkpointFields, status_row };
      });

    const green_count = checkpoints.filter((c: { status_row: ConsultingCheckpointStatus | null }) => c.status_row?.status === 'green').length;
    const orange_count = checkpoints.filter((c: { status_row: ConsultingCheckpointStatus | null }) => c.status_row?.status === 'orange').length;
    const red_count = checkpoints.filter((c: { status_row: ConsultingCheckpointStatus | null }) => c.status_row?.status === 'red').length;

    const { consulting_checkpoints: _drop, ...catFields } = cat;
    return { ...catFields, checkpoints, green_count, orange_count, red_count };
  });
}

export async function createConsultingCompany(data: ConsultingCompanyInsert): Promise<void> {
  const supabase = createAdminClient();

  const { data: company, error } = await supabase
    .from('consulting_companies')
    .insert(data)
    .select('id')
    .single();

  if (error) throw new Error('Unternehmen konnte nicht angelegt werden: ' + error.message);

  const { data: checkpoints } = await supabase
    .from('consulting_checkpoints')
    .select('id')
    .eq('is_default', true);

  if (checkpoints && checkpoints.length > 0) {
    const rows = checkpoints.map((cp) => ({
      company_id: company.id,
      checkpoint_id: cp.id,
      status: 'red' as const,
    }));
    await supabase.from('consulting_checkpoint_status').insert(rows).select();
  }
}

export async function updateConsultingCompany(
  id: string,
  data: ConsultingCompanyUpdate
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('consulting_companies').update(data).eq('id', id);
  if (error) throw new Error('Unternehmen konnte nicht aktualisiert werden: ' + error.message);
}

export async function deleteConsultingCompany(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('consulting_companies').delete().eq('id', id);
  if (error) throw new Error('Unternehmen konnte nicht gelöscht werden: ' + error.message);
}

// ── Checkpoint-Status ─────────────────────────────────────────────────────────

export async function updateConsultingCheckpointStatus(
  id: string,
  data: ConsultingCheckpointStatusUpdate,
  changedBy?: string
): Promise<ConsultingCheckpointStatus> {
  const supabase = createAdminClient();

  const { data: current, error: fetchErr } = await supabase
    .from('consulting_checkpoint_status')
    .select('status, company_id, checkpoint_id')
    .eq('id', id)
    .single();

  if (fetchErr) throw new Error('Status nicht gefunden: ' + fetchErr.message);

  const { data: updated, error } = await supabase
    .from('consulting_checkpoint_status')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error('Status konnte nicht aktualisiert werden: ' + error.message);

  if (data.status && data.status !== current.status) {
    await supabase.from('consulting_audit_log').insert({
      company_id: current.company_id,
      checkpoint_id: current.checkpoint_id,
      old_status: current.status,
      new_status: data.status,
      changed_by: changedBy ?? null,
    });
  }

  return updated;
}

// ── Kategorien ────────────────────────────────────────────────────────────────

export async function createConsultingCategory(
  name: string,
  icon: string | null
): Promise<void> {
  const supabase = createAdminClient();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const { error } = await supabase.from('consulting_categories').insert({ name, slug, icon });
  if (error) throw new Error('Kategorie konnte nicht angelegt werden: ' + error.message);
}

export async function deleteConsultingCategory(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('consulting_categories').delete().eq('id', id);
  if (error) throw new Error('Kategorie konnte nicht gelöscht werden: ' + error.message);
}

// ── Checkpoints ───────────────────────────────────────────────────────────────

export async function createConsultingCheckpoint(
  categoryId: string,
  label: string,
  applyToAll: boolean
): Promise<void> {
  const supabase = createAdminClient();

  const { data: checkpoint, error } = await supabase
    .from('consulting_checkpoints')
    .insert({ category_id: categoryId, label, is_default: applyToAll })
    .select('id')
    .single();

  if (error) throw new Error('Checkpoint konnte nicht angelegt werden: ' + error.message);

  if (applyToAll) {
    const { data: companies } = await supabase.from('consulting_companies').select('id');
    if (companies && companies.length > 0) {
      const rows = companies.map((c) => ({
        company_id: c.id,
        checkpoint_id: checkpoint.id,
        status: 'red' as const,
      }));
      await supabase.from('consulting_checkpoint_status').insert(rows);
    }
  }
}

export async function deleteConsultingCheckpoint(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('consulting_checkpoints').delete().eq('id', id);
  if (error) throw new Error('Checkpoint konnte nicht gelöscht werden: ' + error.message);
}
