import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchDateien, createDateiEintrag } from '@/lib/database/leads';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    const data = await fetchDateien(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  _ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Datei-Uploads sind auf Sevalla noch nicht verfügbar (kein Object Storage konfiguriert)
  return NextResponse.json({ error: 'Datei-Uploads sind auf Sevalla noch nicht verfügbar' }, { status: 501 });
}
