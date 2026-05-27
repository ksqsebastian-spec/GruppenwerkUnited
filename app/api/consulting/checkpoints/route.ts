import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { createConsultingCheckpoint } from '@/lib/database/consulting';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    await createConsultingCheckpoint(
      body.category_id,
      body.label,
      body.apply_to_all ?? true
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
