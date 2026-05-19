import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(): Promise<NextResponse> {
  const db = createAdminClient();
  const { data, error } = await db.from('appointment_types').select('*').order('name');
  if (error) {
    return NextResponse.json({ error: 'Termintypen konnten nicht geladen werden' }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
