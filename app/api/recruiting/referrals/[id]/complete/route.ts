import { requireAuth } from '@/lib/modules/recruiting/auth';
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/modules/recruiting/db";
import { logAudit } from "@/lib/modules/recruiting/audit";

// POST /api/recruiting/referrals/[id]/complete — mark empfehlung as eingestellt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  const rows = await sql`
    SELECT * FROM empfehlungen
    WHERE id = ${id}
      AND status = 'offen'
      AND stelle_id IS NOT NULL
      AND (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
    LIMIT 1
  `;

  if (!rows[0]) {
    return NextResponse.json(
      { error: "Empfehlung nicht gefunden oder bereits bearbeitet" },
      { status: 404 }
    );
  }

  const empfehlung = rows[0] as { praemie_betrag: number };
  let praemieBetrag = empfehlung.praemie_betrag;

  try {
    const body = await request.json();
    if (body?.praemie_betrag !== undefined) {
      const betrag = Number(body.praemie_betrag);
      if (!isNaN(betrag) && betrag >= 0) praemieBetrag = betrag;
    }
  } catch {
    // No body is fine — use existing praemie_betrag
  }

  const updated = await sql`
    UPDATE empfehlungen
    SET status = 'eingestellt', praemie_betrag = ${praemieBetrag}
    WHERE id = ${id}
    RETURNING *
  `;

  if (!updated[0]) {
    return NextResponse.json({ error: "Status konnte nicht aktualisiert werden" }, { status: 500 });
  }

  await logAudit({
    userId: authResult.user.id,
    action: "empfehlung.eingestellt",
    targetType: "empfehlung",
    targetId: id,
    details: { praemie_betrag: praemieBetrag },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(updated[0]);
}
