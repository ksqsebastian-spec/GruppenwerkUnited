import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') ?? '50', 10)));
    const companySlug = searchParams.get('company');
    const status = searchParams.get('status');
    const offset = (page - 1) * pageSize;

    const validStatus = status === 'active' || status === 'expired' ? status : null;
    const slugFilter = companySlug || null;

    const [rows, countRows] = await Promise.all([
      sql`
        SELECT * FROM vob.vob_dashboard
        WHERE (${slugFilter}::text IS NULL OR company_slug = ${slugFilter}::text)
          AND (${validStatus}::text IS NULL OR status = ${validStatus}::text)
        ORDER BY deadline_date ASC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) AS count FROM vob.vob_dashboard
        WHERE (${slugFilter}::text IS NULL OR company_slug = ${slugFilter}::text)
          AND (${validStatus}::text IS NULL OR status = ${validStatus}::text)
      `,
    ]);

    return NextResponse.json({
      tenders: rows,
      total: Number((countRows[0] as { count: string }).count),
      page,
      pageSize,
    });
  } catch (err) {
    console.error('Unerwarteter Fehler beim Laden der Ausschreibungen:', err);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
