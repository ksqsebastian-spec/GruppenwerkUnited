import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(): Promise<NextResponse> {
  const db = createAdminClient();
  const { data, error } = await db.from('damage_types').select('*').order('name');
  if (error) {
    return NextResponse.json({ error: 'Schadenstypen konnten nicht geladen werden' }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
