import { requireAuth } from '@/lib/modules/affiliate/auth';
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/modules/affiliate/db";

// GET /api/affiliate/referrals/[id] — einzelne Empfehlung abrufen
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  const rows = await sql`
    SELECT * FROM empfehlungen
    WHERE id = ${id}
      AND handwerker_id IS NOT NULL
      AND (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
    LIMIT 1
  `;

  if (!rows[0]) {
    return NextResponse.json({ error: "Empfehlung nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
