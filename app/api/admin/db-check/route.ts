import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await sql`SELECT id FROM datenkodierungen LIMIT 1`;
    return NextResponse.json({ exists: true, rowCount: rows.length });
  } catch (err) {
    return NextResponse.json(
      { exists: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
