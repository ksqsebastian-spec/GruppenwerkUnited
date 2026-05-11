import sql from '@/lib/db';
import type {
  AutomatisierungsKnoten,
  AutomatisierungsKnotenInsert,
  AutomatisierungsKnotenUpdate,
} from '@/types';

export async function fetchAutomatisierungsknoten(
  companyId: string
): Promise<AutomatisierungsKnoten[]> {
  const rows = await sql`
    SELECT * FROM automation_nodes
    WHERE company = ${companyId} AND is_active = true
    ORDER BY position ASC
  `;
  return rows as unknown as AutomatisierungsKnoten[];
}

export async function createAutomatisierungsknoten(
  companyId: string,
  input: Omit<AutomatisierungsKnotenInsert, 'company'>
): Promise<AutomatisierungsKnoten> {
  const rows = await sql`
    INSERT INTO automation_nodes ${sql({ ...input, company: companyId } as Record<string, unknown>)}
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Automatisierungsknoten konnte nicht erstellt werden');
  return rows[0] as AutomatisierungsKnoten;
}

export async function updateAutomatisierungsknoten(
  companyId: string,
  id: string,
  updates: AutomatisierungsKnotenUpdate
): Promise<AutomatisierungsKnoten> {
  const rows = await sql`
    UPDATE automation_nodes
    SET ${sql(updates as Record<string, unknown>)}
    WHERE id = ${id} AND company = ${companyId}
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Automatisierungsknoten konnte nicht aktualisiert werden');
  return rows[0] as AutomatisierungsKnoten;
}

export async function updateKnotenPosition(
  id: string,
  x: number,
  y: number
): Promise<void> {
  await sql`
    UPDATE automation_nodes SET position_x = ${x}, position_y = ${y} WHERE id = ${id}
  `;
}

export async function deleteAutomatisierungsknoten(
  companyId: string,
  id: string
): Promise<void> {
  await sql`DELETE FROM automation_nodes WHERE id = ${id} AND company = ${companyId}`;
}
