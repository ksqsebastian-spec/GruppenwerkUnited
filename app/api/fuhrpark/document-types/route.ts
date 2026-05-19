import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const db = createAdminClient();
  const { data, error } = await db.from('document_types').select('id, name, description').order('name');
  if (error) {
    return NextResponse.json({ error: 'Dokumenttypen konnten nicht geladen werden' }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
