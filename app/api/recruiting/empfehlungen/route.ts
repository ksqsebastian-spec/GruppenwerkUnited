import { requireAuth, validateOrigin } from '@/lib/modules/recruiting/auth';
import { NextRequest, NextResponse } from "next/server";
import { empfehlungCreateSchema } from "@/lib/modules/recruiting/validators";
import { sql } from "@/lib/modules/recruiting/db";
import { logAudit } from "@/lib/modules/recruiting/audit";

const VALID_STATUSES = ["offen", "eingestellt", "probezeit_bestanden", "ausgezahlt"] as const;

function generateRefCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/recruiting/empfehlungen — create new empfehlung (admin)
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

  const praemieRows = await sql`SELECT value FROM app_settings WHERE key = 'praemie_betrag_default' LIMIT 1`;
  const praemieBetrag = Number((praemieRows[0] as { value: string } | undefined)?.value ?? 1000);

  const refCode = parsed.data.ref_code || generateRefCode();
  const insertData = { ...parsed.data, ref_code: refCode, praemie_betrag: praemieBetrag, company: authResult.companyId };

  try {
    const [row] = await sql`
      INSERT INTO empfehlungen ${sql(insertData)}
      RETURNING
        *,
        (SELECT json_build_object('id', s.id, 'title', s.title)
         FROM stellen s WHERE s.id = stelle_id) AS stelle
    `;

    await logAudit({
      userId: authResult.user.id,
      action: "empfehlung.created",
      targetType: "empfehlung",
      targetId: (row as { id: string }).id,
      details: { kandidat_name: parsed.data.kandidat_name, ref_code: refCode },
      ipAddress: request.headers.get("x-forwarded-for"),
    });

    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Empfehlung konnte nicht erstellt werden" }, { status: 500 });
  }
}

// PATCH /api/recruiting/empfehlungen — update empfehlung fields
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
    empfehler_name,
    empfehler_email,
    kandidat_name,
    kandidat_kontakt,
    stelle_id,
    position,
    iban,
    bic,
    kontoinhaber,
    bank_name,
    praemie_betrag,
  } = body as Record<string, unknown>;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });
  }

  const beforeRows = await sql`
    SELECT status FROM empfehlungen
    WHERE id = ${id} AND stelle_id IS NOT NULL
    LIMIT 1
  `;
  const before = beforeRows[0] as { status: string } | undefined;

  const updateData: Record<string, unknown> = {};

  if (status && typeof status === "string") {
    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
    }
    updateData.status = status;
    if (status === "ausgezahlt") updateData.ausgezahlt_am = new Date().toISOString();
    if (status !== "ausgezahlt" && before?.status === "ausgezahlt") updateData.ausgezahlt_am = null;
  }

  if (praemie_betrag !== undefined) {
    const betrag = Number(praemie_betrag);
    if (!isNaN(betrag) && betrag >= 0) updateData.praemie_betrag = betrag;
  }

  if (empfehler_name !== undefined) updateData.empfehler_name = empfehler_name;
  if (empfehler_email !== undefined) updateData.empfehler_email = empfehler_email;
  if (kandidat_name !== undefined) updateData.kandidat_name = kandidat_name;
  if (kandidat_kontakt !== undefined) updateData.kandidat_kontakt = kandidat_kontakt;
  if (stelle_id !== undefined) updateData.stelle_id = stelle_id;
  if (position !== undefined) updateData.position = position;

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

// DELETE /api/recruiting/empfehlungen — delete empfehlung
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Ungültiger Ursprung" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  const empRows = await sql`
    SELECT kandidat_name, ref_code FROM empfehlungen
    WHERE id = ${id} AND stelle_id IS NOT NULL
    LIMIT 1
  `;
  const emp = empRows[0] as { kandidat_name: string; ref_code: string } | undefined;

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
    details: { kandidat_name: emp?.kandidat_name, ref_code: emp?.ref_code },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ success: true });
}
