import { NextRequest, NextResponse } from 'next/server';
import { fetchCosts, createCost } from '@/lib/database/costs';
import type { CostFilters } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId') ?? undefined;
  const costTypeId = searchParams.get('costTypeId') ?? undefined;
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const filters: CostFilters = {
    vehicleId,
    costTypeId,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
  };

  try {
    const rows = await fetchCosts(filters);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Kosten konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  try {
    const row = await createCost(body as Parameters<typeof createCost>[0]);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Kosten konnten nicht erfasst werden' }, { status: 500 });
  }
}
