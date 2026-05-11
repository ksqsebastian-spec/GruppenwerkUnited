import sql from '@/lib/db';
import type { Damage, DamageInsert, DamageUpdate, DamageFilters, DamageStatus } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

export async function fetchDamages(filters?: DamageFilters): Promise<Damage[]> {
  const rows = await sql`
    SELECT d.*,
      json_build_object('id', v.id, 'license_plate', v.license_plate, 'brand', v.brand, 'model', v.model) AS vehicle,
      json_build_object('id', dt.id, 'name', dt.name) AS damage_type,
      COALESCE(
        json_agg(json_build_object('id', di.id, 'file_path', di.file_path, 'uploaded_at', di.uploaded_at))
        FILTER (WHERE di.id IS NOT NULL), '[]'
      ) AS damage_images
    FROM damages d
    JOIN vehicles v ON v.id = d.vehicle_id
    JOIN damage_types dt ON dt.id = d.damage_type_id
    LEFT JOIN damage_images di ON di.damage_id = d.id
    WHERE TRUE
      AND (${filters?.vehicleId ?? null}::uuid IS NULL OR d.vehicle_id = ${filters?.vehicleId ?? null}::uuid)
      AND (${filters?.status ?? null} IS NULL OR d.status = ${filters?.status ?? null})
    GROUP BY d.id, v.id, dt.id
    ORDER BY d.date DESC
  `;
  return rows as Damage[];
}

export async function fetchDamage(id: string): Promise<Damage | null> {
  const rows = await sql`
    SELECT d.*,
      json_build_object('id', v.id, 'license_plate', v.license_plate, 'brand', v.brand, 'model', v.model) AS vehicle,
      json_build_object('id', dt.id, 'name', dt.name) AS damage_type,
      COALESCE(
        json_agg(json_build_object('id', di.id, 'file_path', di.file_path, 'uploaded_at', di.uploaded_at))
        FILTER (WHERE di.id IS NOT NULL), '[]'
      ) AS damage_images
    FROM damages d
    JOIN vehicles v ON v.id = d.vehicle_id
    JOIN damage_types dt ON dt.id = d.damage_type_id
    LEFT JOIN damage_images di ON di.damage_id = d.id
    WHERE d.id = ${id}
    GROUP BY d.id, v.id, dt.id
  `;
  return rows[0] ? (rows[0] as Damage) : null;
}

export async function countOpenDamages(): Promise<number> {
  const rows = await sql`SELECT COUNT(*) AS count FROM damages WHERE status != 'completed'`;
  return Number((rows[0] as { count: string }).count);
}

export async function createDamage(damage: DamageInsert): Promise<Damage> {
  const rows = await sql`
    INSERT INTO damages ${sql(damage as Record<string, unknown>)}
    RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.DAMAGE_CREATE_FAILED);
  return rows[0] as Damage;
}

export async function updateDamage(id: string, updates: DamageUpdate): Promise<Damage> {
  const rows = await sql`
    UPDATE damages
    SET ${sql({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)}
    WHERE id = ${id}
    RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.DAMAGE_UPDATE_FAILED);
  return rows[0] as Damage;
}

export async function updateDamageStatus(id: string, status: DamageStatus): Promise<void> {
  await sql`
    UPDATE damages SET status = ${status}, updated_at = ${new Date().toISOString()} WHERE id = ${id}
  `;
}

export async function deleteDamage(id: string): Promise<void> {
  await sql`DELETE FROM damages WHERE id = ${id}`;
}
