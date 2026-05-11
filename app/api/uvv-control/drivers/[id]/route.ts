import { NextRequest, NextResponse } from 'next/server';
import { fetchDriverWithUvvStatus } from '@/lib/database/uvv-control';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    const row = await fetchDriverWithUvvStatus(id);
    if (!row) return NextResponse.json({ error: 'Fahrer nicht gefunden' }, { status: 404 });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: 'Fahrer konnte nicht geladen werden' }, { status: 500 });
  }
}
