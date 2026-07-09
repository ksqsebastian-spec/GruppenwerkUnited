import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { createConsultingCategory } from '@/lib/database/consulting';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('consulting_categories')
    .select('*, consulting_checkpoints(*)')
    .order('sort_order');

  if (error) {
    console.error('[/api/consulting/categories GET]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    await createConsultingCategory(body.name, body.icon ?? null);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('[/api/consulting/categories POST]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
