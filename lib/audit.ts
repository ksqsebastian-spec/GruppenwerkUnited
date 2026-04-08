import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Gemeinsamer Audit-Logger für alle Module (Recruiting, Affiliate, …).
 * Schreibt in die zentrale `audit_log`-Tabelle.
 *
 * Design: Fehler im Audit-Log dürfen den Hauptfluss niemals unterbrechen.
 */

export interface AuditLogParams {
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const adminClient = createAdminClient();
    await adminClient.from('audit_log').insert({
      user_id: params.userId,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId,
      details: params.details ?? {},
      ip_address: params.ipAddress ?? null,
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error('Audit log fehlgeschlagen:', error);
  }
}
