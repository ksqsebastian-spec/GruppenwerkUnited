/**
 * Einstellungen + Prüfer der Führerscheinkontrolle.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { ERROR_MESSAGES } from '@/lib/errors/messages';
import type {
  LicenseCheckSettings,
  LicenseCheckSettingsUpdate,
  LicenseCheckInspector,
  LicenseCheckInspectorInsert,
  LicenseCheckInspectorUpdate,
} from '@/types';

// Singleton-Settings-Row (es gibt nur eine Zeile, ID ist fest seeded).
const LICENSE_SETTINGS_ROW_ID = '00000000-0000-0000-0000-000000000001';

const SETTINGS_COLUMNS = 'id, check_interval_months, warning_days_before, updated_at';
const INSPECTOR_COLUMNS = 'id, name, email, status, created_at';

export async function fetchLicenseSettings(): Promise<LicenseCheckSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('license_check_settings')
    .select(SETTINGS_COLUMNS)
    .single();

  if (error) {
    console.error('Fehler beim Laden der Einstellungen:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_SETTINGS_LOAD_FAILED);
  }

  return data;
}

export async function updateLicenseSettings(
  updates: LicenseCheckSettingsUpdate
): Promise<LicenseCheckSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('license_check_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', LICENSE_SETTINGS_ROW_ID)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren der Einstellungen:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_SETTINGS_UPDATE_FAILED);
  }

  return data;
}

export async function fetchLicenseInspectors(
  status?: 'active' | 'archived'
): Promise<LicenseCheckInspector[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('license_check_inspectors')
    .select(INSPECTOR_COLUMNS)
    .order('name');

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Prüfer:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_INSPECTOR_LOAD_FAILED);
  }

  return data ?? [];
}

export async function createLicenseInspector(
  inspector: LicenseCheckInspectorInsert
): Promise<LicenseCheckInspector> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('license_check_inspectors')
    .insert(inspector)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen des Prüfers:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_INSPECTOR_CREATE_FAILED);
  }

  return data;
}

export async function updateLicenseInspector(
  id: string,
  updates: LicenseCheckInspectorUpdate
): Promise<LicenseCheckInspector> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('license_check_inspectors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Prüfers:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_INSPECTOR_UPDATE_FAILED);
  }

  return data;
}

export async function archiveLicenseInspector(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('license_check_inspectors')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Archivieren des Prüfers:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_INSPECTOR_DELETE_FAILED);
  }
}
