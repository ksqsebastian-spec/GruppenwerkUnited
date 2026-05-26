import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('consulting_field_types')
    .select('*')
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('consulting_field_types')
      .insert({ key: body.key, label: body.label, sort_order: body.sort_order ?? 99 })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
