import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import type { Company, DashboardRow } from '@/lib/modules/vob/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  if (!slug || slug.trim() === '') {
    return NextResponse.json({ error: 'Slug ist erforderlich' }, { status: 400 });
  }

  const companyRows = await sql`SELECT * FROM vob.companies WHERE slug = ${slug} LIMIT 1`;
  if (!companyRows[0]) {
    return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
  }

  try {
    const tenderRows = await sql`
      SELECT * FROM vob.vob_dashboard
      WHERE company_slug = ${slug}
      ORDER BY deadline_date ASC
    `;

    return NextResponse.json({
      company: companyRows[0] as Company,
      tenders: tenderRows as unknown as DashboardRow[],
    });
  } catch (err) {
    console.error('Fehler beim Laden der Ausschreibungen für Export:', err);
    return NextResponse.json({ error: 'Ausschreibungen konnten nicht geladen werden' }, { status: 500 });
  }
}
