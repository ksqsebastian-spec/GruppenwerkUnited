import { requireAdmin } from '@/lib/modules/recruiting/auth';
import { validateOrigin } from '@/lib/modules/recruiting/auth';
import { NextRequest, NextResponse } from "next/server";
import { empfehlungCreateSchema } from "@/lib/modules/recruiting/validators";
import { createAdminClient } from "@/lib/modules/recruiting/supabase-admin";
import { logAudit } from "@/lib/modules/recruiting/audit";

const VALID_STATUSES = ["offen", "eingestellt", "probezeit_bestanden", "ausgezahlt"] as const;

// POST /api/recruiting/empfehlungen — create new empfehlung (admin)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Ungültiger Ursprung" }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ungültiger Request-Body" },
      { status: 400 }
    );
  }

  const parsed = empfehlungCreateSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    return NextResponse.json(
      { error: "Validierungsfehler", detail: fieldErrors.join("; ") },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  // Auto-generate ref_code
  let refCode = parsed.data.ref_code;
  if (!refCode) {
    const { data: generated } = await adminClient.rpc("generate_ref_code");
    refCode = generated as string;
  }

  // Fetch global default praemie
  const { data: settings } = await adminClient
    .from("app_settings")
    .select("value")
    .eq("key", "praemie_betrag_default")
    .single();
  const praemieBetrag = Number(settings?.value ?? 1000);

  const { data, error } = await adminClient
    .from("empfehlungen")
    .insert({
      ...parsed.data,
      ref_code: refCode,
      praemie_betrag: praemieBetrag,
    })
    .select("*, stelle:stelle_id(id, title)")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Empfehlung konnte nicht erstellt werden"},
      { status: 500 }
    );
  }

  await logAudit({
    userId: authResult.user.id,
    action: "empfehlung.created",
    targetType: "empfehlung",
    targetId: data.id,
    details: { kandidat_name: parsed.data.kandidat_name, ref_code: refCode },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/recruiting/empfehlungen — update empfehlung fields
export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Ungültiger Ursprung" }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ungültiger Request-Body" },
      { status: 400 }
    );
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
    return NextResponse.json(
      { error: "ID erforderlich" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  // Get current empfehlung for audit
  const { data: before } = await adminClient
    .from("empfehlungen")
    .select("status")
    .eq("id", id)
    .single();

  const updateData: Record<string, unknown> = {};

  // Status update
  if (status && typeof status === "string") {
    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        { error: "Ungültiger Status" },
        { status: 400 }
      );
    }
    updateData.status = status;

    if (status === "ausgezahlt") {
      updateData.ausgezahlt_am = new Date().toISOString();
    }
    if (status !== "ausgezahlt" && before?.status === "ausgezahlt") {
      updateData.ausgezahlt_am = null;
    }
  }

  // Praemie update (direct override)
  if (praemie_betrag !== undefined) {
    const betrag = Number(praemie_betrag);
    if (!isNaN(betrag) && betrag >= 0) {
      updateData.praemie_betrag = betrag;
    }
  }

  // Text field updates
  if (empfehler_name !== undefined) updateData.empfehler_name = empfehler_name;
  if (empfehler_email !== undefined) updateData.empfehler_email = empfehler_email;
  if (kandidat_name !== undefined) updateData.kandidat_name = kandidat_name;
  if (kandidat_kontakt !== undefined) updateData.kandidat_kontakt = kandidat_kontakt;
  if (stelle_id !== undefined) updateData.stelle_id = stelle_id;
  if (position !== undefined) updateData.position = position;

  // Bankdaten fields
  if (iban !== undefined) updateData.iban = iban;
  if (bic !== undefined) updateData.bic = bic;
  if (kontoinhaber !== undefined) updateData.kontoinhaber = kontoinhaber;
  if (bank_name !== undefined) updateData.bank_name = bank_name;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Keine Änderungen" },
      { status: 400 }
    );
  }

  const { error } = await adminClient
    .from("empfehlungen")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Aktualisierung fehlgeschlagen"},
      { status: 500 }
    );
  }

  await logAudit({
    userId: authResult.user.id,
    action: "empfehlung.updated",
    targetType: "empfehlung",
    targetId: id as string,
    details: { changes: updateData },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/recruiting/empfehlungen — delete empfehlung
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Ungültiger Ursprung" }, { status: 403 });
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: emp } = await adminClient
    .from("empfehlungen")
    .select("kandidat_name, ref_code")
    .eq("id", id)
    .single();

  const { error } = await adminClient
    .from("empfehlungen")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Empfehlung konnte nicht gelöscht werden"},
      { status: 500 }
    );
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
