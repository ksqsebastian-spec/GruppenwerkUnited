import { NextRequest, NextResponse } from 'next/server';
import { completeAppointment } from '@/lib/database/appointments';

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    await completeAppointment(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Termin konnte nicht abgeschlossen werden' }, { status: 500 });
  }
}
