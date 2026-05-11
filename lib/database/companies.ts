import sql from '@/lib/db';
import type { Company, CompanyInsert, CompanyUpdate } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

export async function fetchCompanies(): Promise<Company[]> {
  return sql`SELECT * FROM companies ORDER BY name` as Promise<Company[]>;
}

export async function createCompany(company: CompanyInsert): Promise<Company> {
  const rows = await sql`
    INSERT INTO companies ${sql(company as Record<string, unknown>)}
    RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.COMPANY_CREATE_FAILED);
  return rows[0] as Company;
}

export async function updateCompany(id: string, updates: CompanyUpdate): Promise<Company> {
  const rows = await sql`
    UPDATE companies SET ${sql(updates as Record<string, unknown>)} WHERE id = ${id} RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.COMPANY_UPDATE_FAILED);
  return rows[0] as Company;
}

export async function deleteCompany(id: string): Promise<void> {
  try {
    await sql`DELETE FROM companies WHERE id = ${id}`;
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg.code === '23503') throw new Error(ERROR_MESSAGES.COMPANY_IN_USE);
    throw new Error(ERROR_MESSAGES.COMPANY_DELETE_FAILED);
  }
}
