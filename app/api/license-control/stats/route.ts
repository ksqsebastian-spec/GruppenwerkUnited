import { NextResponse } from 'next/server';
import { fetchLicenseControlStats, fetchLicenseWarningCount } from '@/lib/database/license-control';

export async function GET(): Promise<NextResponse> {
  try {
    const [stats, warningCount] = await Promise.all([
      fetchLicenseControlStats(),
      fetchLicenseWarningCount(),
    ]);
    return NextResponse.json({ stats, warningCount });
  } catch {
    return NextResponse.json({ error: 'Statistiken konnten nicht geladen werden' }, { status: 500 });
  }
}
