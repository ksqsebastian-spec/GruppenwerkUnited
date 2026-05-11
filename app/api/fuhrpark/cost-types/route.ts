import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await sql`SELECT * FROM cost_types ORDER BY name`;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Kostentypen konnten nicht geladen werden' }, { status: 500 });
  }
}
