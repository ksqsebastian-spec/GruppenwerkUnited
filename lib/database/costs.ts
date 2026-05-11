import sql from '@/lib/db';
import type { Cost, CostInsert, CostUpdate, CostFilters, CostType } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

export async function fetchCost(id: string): Promise<Cost> {
  const rows = await sql`
    SELECT c.*,
      json_build_object('id', v.id, 'license_plate', v.license_plate, 'brand', v.brand, 'model', v.model) AS vehicle,
      json_build_object('id', ct.id, 'name', ct.name, 'icon', ct.icon) AS cost_type
    FROM costs c
    JOIN vehicles v ON v.id = c.vehicle_id
    JOIN cost_types ct ON ct.id = c.cost_type_id
    WHERE c.id = ${id}
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.COST_NOT_FOUND);
  return rows[0] as Cost;
}

export async function fetchCostTypes(): Promise<CostType[]> {
  return sql`SELECT * FROM cost_types ORDER BY name` as Promise<CostType[]>;
}

export async function fetchCosts(filters?: CostFilters): Promise<Cost[]> {
  const rows = await sql`
    SELECT c.*,
      json_build_object('id', v.id, 'license_plate', v.license_plate, 'brand', v.brand, 'model', v.model) AS vehicle,
      json_build_object('id', ct.id, 'name', ct.name, 'icon', ct.icon) AS cost_type
    FROM costs c
    JOIN vehicles v ON v.id = c.vehicle_id
    JOIN cost_types ct ON ct.id = c.cost_type_id
    WHERE TRUE
      AND (${filters?.vehicleId ?? null}::uuid IS NULL OR c.vehicle_id = ${filters?.vehicleId ?? null}::uuid)
      AND (${filters?.costTypeId ?? null}::uuid IS NULL OR c.cost_type_id = ${filters?.costTypeId ?? null}::uuid)
      AND (${filters?.dateFrom?.toISOString().split('T')[0] ?? null} IS NULL OR c.date >= ${filters?.dateFrom?.toISOString().split('T')[0] ?? null}::date)
      AND (${filters?.dateTo?.toISOString().split('T')[0] ?? null} IS NULL OR c.date <= ${filters?.dateTo?.toISOString().split('T')[0] ?? null}::date)
    ORDER BY c.date DESC
  `;
  return rows as Cost[];
}

export async function fetchCostsThisMonth(): Promise<number> {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const rows = await sql`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM costs
    WHERE date >= ${firstDay}::date AND date <= ${lastDay}::date
  `;
  return Number((rows[0] as { total: string }).total);
}

export async function createCost(cost: CostInsert): Promise<Cost> {
  const rows = await sql`
    INSERT INTO costs ${sql(cost as Record<string, unknown>)}
    RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.COST_CREATE_FAILED);

  if (cost.mileage_at_cost) {
    await sql`
      INSERT INTO mileage_logs (vehicle_id, mileage, source)
      VALUES (${cost.vehicle_id}, ${cost.mileage_at_cost}, 'cost_entry')
    `;
    await sql`
      UPDATE vehicles SET mileage = ${cost.mileage_at_cost} WHERE id = ${cost.vehicle_id}
    `;
  }

  return rows[0] as Cost;
}

export async function updateCost(id: string, cost: CostUpdate): Promise<Cost> {
  const rows = await sql`
    UPDATE costs SET ${sql(cost as Record<string, unknown>)} WHERE id = ${id} RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.COST_UPDATE_FAILED);

  if (cost.mileage_at_cost && cost.vehicle_id) {
    await sql`
      INSERT INTO mileage_logs (vehicle_id, mileage, source)
      VALUES (${cost.vehicle_id}, ${cost.mileage_at_cost}, 'cost_entry')
    `;
    await sql`
      UPDATE vehicles SET mileage = ${cost.mileage_at_cost} WHERE id = ${cost.vehicle_id}
    `;
  }

  return rows[0] as Cost;
}

export async function deleteCost(id: string): Promise<void> {
  await sql`DELETE FROM costs WHERE id = ${id}`;
}
