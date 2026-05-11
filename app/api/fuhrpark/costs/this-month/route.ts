import { NextResponse } from 'next/server';
import { fetchCostsThisMonth } from '@/lib/database/costs';

export async function GET(): Promise<NextResponse> {
  try {
    const total = await fetchCostsThisMonth();
    return NextResponse.json({ total });
  } catch {
    return NextResponse.json({ error: 'Monatskosten konnten nicht geladen werden' }, { status: 500 });
  }
}
