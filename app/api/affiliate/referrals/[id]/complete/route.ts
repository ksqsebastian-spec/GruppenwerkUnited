import { requireAuth } from '@/lib/modules/affiliate/auth';
import { NextRequest, NextResponse } from "next/server";
import { empfehlungCompleteSchema } from "@/lib/modules/affiliate/validators";
import { sql } from "@/lib/modules/affiliate/db";
import { berechneProvision } from "@/lib/modules/affiliate/utils";
import { logAudit } from "@/lib/modules/affiliate/audit";

// POST /api/referrals/[id]/complete — mark empfehlung as erledigt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const parsed = empfehlungCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.format() }, { status: 400 });
  }

  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  const rows = await sql`
    SELECT e.*, h.provision_prozent AS handwerker_provision_prozent
    FROM empfehlungen e
    LEFT JOIN handwerker h ON h.id = e.handwerker_id
    WHERE e.id = ${id}
      AND e.status = 'offen'
      AND e.handwerker_id IS NOT NULL
      AND (${companyFilter}::text IS NULL OR e.company = ${companyFilter}::text)
    LIMIT 1
  `;

  if (!rows[0]) {
    return NextResponse.json(
      { error: "Empfehlung nicht gefunden oder bereits erledigt" },
      { status: 404 }
    );
  }

  const empfehlung = rows[0] as { handwerker_provision_prozent: number };
  const provisionProzent = empfehlung.handwerker_provision_prozent ?? 5;
  const provisionBetrag = berechneProvision(parsed.data.rechnungsbetrag, provisionProzent);

  const updated = await sql`
    UPDATE empfehlungen
    SET status = 'erledigt',
        rechnungsbetrag = ${parsed.data.rechnungsbetrag},
        provision_betrag = ${provisionBetrag}
    WHERE id = ${id}
    RETURNING *
  `;

  if (!updated[0]) {
    return NextResponse.json({ error: "Status konnte nicht aktualisiert werden" }, { status: 500 });
  }

  await logAudit({
    userId: authResult.user.id,
    action: "empfehlung.completed",
    targetType: "empfehlung",
    targetId: id,
    details: { rechnungsbetrag: parsed.data.rechnungsbetrag, provision_betrag: provisionBetrag },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(updated[0]);
}
