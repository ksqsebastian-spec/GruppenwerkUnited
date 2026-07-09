import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) return session;

  const companyId = req.nextUrl.searchParams.get('company_id');
  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('consulting_credentials')
    .select('*')
    .eq('company_id', companyId)
    .order('sort_order');

  if (error) {
    console.error('[/api/consulting/credentials GET]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('consulting_credentials')
      .insert(body)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[/api/consulting/credentials POST]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
