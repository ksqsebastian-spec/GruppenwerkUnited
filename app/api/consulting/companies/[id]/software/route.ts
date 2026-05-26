import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/api';

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireSession();
    const { id } = await params;
    const { data, error } = await createAdminClient()
      .from('consulting_company_software')
      .select('*')
      .eq('company_id', id)
      .order('sort_order')
      .order('name');
    if (error) throw new Error(error.message);
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireSession();
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;
    const { data, error } = await createAdminClient()
      .from('consulting_company_software')
      .insert({ ...body, company_id: id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}
