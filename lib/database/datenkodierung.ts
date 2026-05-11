import sql from '@/lib/db';
import { generateCode } from '@/lib/datenkodierung/code-generator';
import { ERROR_MESSAGES } from '@/lib/errors/messages';
import type { Datenkodierung, DatenkodierungInsert } from '@/types';

export async function fetchDatenkodierungen(companyId: string, search?: string, tag?: string): Promise<Datenkodierung[]> {
  const searchTerm = search?.trim() ? `%${search.trim()}%` : null;
  const tagTerm = tag?.trim() || null;

  const rows = await sql`
    SELECT * FROM datenkodierungen
    WHERE company = ${companyId}
      AND (${searchTerm} IS NULL OR (
        code ILIKE ${searchTerm} OR name ILIKE ${searchTerm} OR adresse ILIKE ${searchTerm}
      ))
      AND (${tagTerm} IS NULL OR tags @> ARRAY[${tagTerm}]::text[])
    ORDER BY created_at DESC
  `;
  return rows as unknown as Datenkodierung[];
}

export async function createDatenkodierung(companyId: string, input: DatenkodierungInsert): Promise<Datenkodierung> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();
    try {
      const rows = await sql`
        INSERT INTO datenkodierungen ${sql({ ...input, code, company: companyId, tags: input.tags ?? [] } as Record<string, unknown>)}
        RETURNING *
      `;
      if (rows[0]) return rows[0] as Datenkodierung;
    } catch (err: unknown) {
      const pg = err as { code?: string };
      if (pg.code !== '23505') throw new Error(ERROR_MESSAGES.KODIERUNG_CREATE_FAILED);
    }
  }
  throw new Error(ERROR_MESSAGES.KODIERUNG_CREATE_FAILED);
}

export async function updateDatenkodierungTags(companyId: string, id: string, tags: string[]): Promise<Datenkodierung> {
  const rows = await sql`
    UPDATE datenkodierungen SET tags = ${tags} WHERE id = ${id} AND company = ${companyId} RETURNING *
  `;
  if (!rows[0]) throw new Error('Tags konnten nicht gespeichert werden');
  return rows[0] as Datenkodierung;
}

export async function deleteDatenkodierung(companyId: string, id: string): Promise<void> {
  await sql`DELETE FROM datenkodierungen WHERE id = ${id} AND company = ${companyId}`;
}
