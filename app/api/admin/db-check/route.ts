import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminSession } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) return session;

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('datenkodierungen')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        exists: false,
        error: 'Datenbank-Prüfung fehlgeschlagen',
      });
    }

    return NextResponse.json({ exists: true, rowCount: data?.length ?? 0 });
  } catch {
    return NextResponse.json(
      { exists: false, error: 'Datenbank-Prüfung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
