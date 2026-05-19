import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('datenkodierungen')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        exists: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }

    return NextResponse.json({ exists: true, rowCount: data?.length ?? 0 });
  } catch (err) {
    return NextResponse.json(
      { exists: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
