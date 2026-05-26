import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const companyId = req.nextUrl.searchParams.get('company_id');
  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('consulting_credentials')
    .select('*')
    .eq('company_id', companyId)
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
      .from('consulting_credentials')
      .insert(body)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
