import { NextResponse } from 'next/server';
import { fetchUvvControlStats, fetchUvvWarningCount } from '@/lib/database/uvv-control';

export async function GET(): Promise<NextResponse> {
  try {
    const [stats, warningCount] = await Promise.all([
      fetchUvvControlStats(),
      fetchUvvWarningCount(),
    ]);
    return NextResponse.json({ stats, warningCount });
  } catch {
    return NextResponse.json({ error: 'Statistiken konnten nicht geladen werden' }, { status: 500 });
  }
}
