import { requireAuth, validateOrigin } from '@/lib/modules/affiliate/auth';
import { NextRequest, NextResponse } from "next/server";
import { empfehlungCreateSchema } from "@/lib/modules/affiliate/validators";
import { sql } from "@/lib/modules/affiliate/db";
import { logAudit } from "@/lib/modules/affiliate/audit";
import { berechneProvision } from "@/lib/modules/affiliate/utils";

const VALID_STATUSES = ["offen", "erledigt", "ausgezahlt"] as const;

function generateRefCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/affiliate/empfehlungen — create new empfehlung (admin)
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Ungültiger Ursprung" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const parsed = empfehlungCreateSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    return NextResponse.json({ error: "Validierungsfehler", detail: fieldErrors.join("; ") }, { status: 400 });
  }

  const refCode = parsed.data.ref_code || generateRefCode();
  const insertData = { ...parsed.data, ref_code: refCode, company: authResult.companyId };

  try {
    const [row] = await sql`
      INSERT INTO empfehlungen ${sql(insertData)}
      RETURNING
        *,
        (SELECT json_build_object('id', h.id, 'name', h.name, 'email', h.email, 'telefon', h.telefon, 'provision_prozent', h.provision_prozent)
         FROM handwerker h WHERE h.id = handwerker_id) AS handwerker
    `;

    await logAudit({
      userId: authResult.user.id,
      action: "empfehlung.created",
      targetType: "empfehlung",
      targetId: (row as { id: string }).id,
      details: { kunde_name: parsed.data.kunde_name, ref_code: refCode },
      ipAddress: request.headers.get("x-forwarded-for"),
    });

    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Empfehlung konnte nicht erstellt werden" }, { status: 500 });
  }
}

// PATCH /api/affiliate/empfehlungen — update empfehlung fields
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Ungültiger Ursprung" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const {
    id,
    status,
    rechnungsbetrag,
    empfehler_name,
    empfehler_email,
    kunde_name,
    kunde_kontakt,
    handwerker_id,
    iban,
    bic,
    kontoinhaber,
    bank_name,
    provision_betrag: directProvisionBetrag,
  } = body as Record<string, unknown>;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });
  }

  const beforeRows = await sql`
    SELECT e.status, e.rechnungsbetrag, h.provision_prozent AS hw_provision_prozent
    FROM empfehlungen e
    LEFT JOIN handwerker h ON h.id = e.handwerker_id
    WHERE e.id = ${id} AND e.handwerker_id IS NOT NULL
    LIMIT 1
  `;
  const before = beforeRows[0] as { status: string; rechnungsbetrag: number; hw_provision_prozent: number } | undefined;

  const updateData: Record<string, unknown> = {};

  if (status && typeof status === "string") {
    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
    }
    updateData.status = status;
    if (status === "ausgezahlt") updateData.ausgezahlt_am = new Date().toISOString();
    if (status !== "ausgezahlt" && before?.status === "ausgezahlt") updateData.ausgezahlt_am = null;
  }

  if (rechnungsbetrag !== undefined) {
    const betrag = Number(rechnungsbetrag);
    if (isNaN(betrag) || betrag < 0) {
      return NextResponse.json({ error: "Ungültiger Betrag" }, { status: 400 });
    }
    updateData.rechnungsbetrag = betrag;
    const provisionProzent = before?.hw_provision_prozent ?? 5;
    updateData.provision_betrag = berechneProvision(betrag, provisionProzent);
  }

  if (directProvisionBetrag !== undefined && rechnungsbetrag === undefined) {
    const betrag = Number(directProvisionBetrag);
    if (!isNaN(betrag) && betrag >= 0) updateData.provision_betrag = betrag;
  }

  if (empfehler_name !== undefined) updateData.empfehler_name = empfehler_name;
  if (empfehler_email !== undefined) updateData.empfehler_email = empfehler_email;
  if (kunde_name !== undefined) updateData.kunde_name = kunde_name;
  if (kunde_kontakt !== undefined) updateData.kunde_kontakt = kunde_kontakt;
  if (handwerker_id !== undefined) updateData.handwerker_id = handwerker_id;

  if (iban !== undefined) {
    if (typeof iban !== 'string' || iban.length > 34) return NextResponse.json({ error: 'Ungültige IBAN' }, { status: 400 });
    updateData.iban = iban;
  }
  if (bic !== undefined) {
    if (typeof bic !== 'string' || bic.length > 11) return NextResponse.json({ error: 'Ungültige BIC' }, { status: 400 });
    updateData.bic = bic;
  }
  if (kontoinhaber !== undefined) {
    if (typeof kontoinhaber !== 'string' || kontoinhaber.length > 120) return NextResponse.json({ error: 'Ungültiger Kontoinhaber' }, { status: 400 });
    updateData.kontoinhaber = kontoinhaber;
  }
  if (bank_name !== undefined) {
    if (typeof bank_name !== 'string' || bank_name.length > 120) return NextResponse.json({ error: 'Ungültiger Bankname' }, { status: 400 });
    updateData.bank_name = bank_name;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Keine Änderungen" }, { status: 400 });
  }

  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  try {
    await sql`
      UPDATE empfehlungen
      SET ${sql(updateData)}
      WHERE id = ${id}
        AND (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
    `;
  } catch {
    return NextResponse.json({ error: "Aktualisierung fehlgeschlagen" }, { status: 500 });
  }

  await logAudit({
    userId: authResult.user.id,
    action: "empfehlung.updated",
    targetType: "empfehlung",
    targetId: id,
    details: { changes: updateData },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/affiliate/empfehlungen — delete empfehlung
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Ungültiger Ursprung" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  const empRows = await sql`
    SELECT kunde_name, ref_code FROM empfehlungen
    WHERE id = ${id} AND handwerker_id IS NOT NULL
    LIMIT 1
  `;
  const emp = empRows[0] as { kunde_name: string; ref_code: string } | undefined;

  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  try {
    await sql`
      DELETE FROM empfehlungen
      WHERE id = ${id}
        AND (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
    `;
  } catch {
    return NextResponse.json({ error: "Empfehlung konnte nicht gelöscht werden" }, { status: 500 });
  }

  await logAudit({
    userId: authResult.user.id,
    action: "empfehlung.deleted",
    targetType: "empfehlung",
    targetId: id,
    details: { kunde_name: emp?.kunde_name, ref_code: emp?.ref_code },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ success: true });
}
