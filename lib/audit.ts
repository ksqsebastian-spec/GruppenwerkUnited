import sql from '@/lib/db';

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
    await sql`
      INSERT INTO audit_log (user_id, action, target_type, target_id, details, ip_address)
      VALUES (
        ${params.userId}, ${params.action}, ${params.targetType}, ${params.targetId},
        ${JSON.stringify(params.details ?? {})}, ${params.ipAddress ?? null}
      )
    `;
  } catch (error) {
    console.error('Audit log fehlgeschlagen:', error);
  }
}
