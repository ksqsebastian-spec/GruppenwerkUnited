import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchAllTags } from '@/lib/database/markitdown';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  try {
    const rows = await fetchAllTags();
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
