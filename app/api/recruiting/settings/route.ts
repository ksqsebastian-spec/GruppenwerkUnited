import { requireAdmin } from '@/lib/modules/recruiting/auth';
import { validateOrigin } from '@/lib/modules/recruiting/auth';
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/modules/recruiting/supabase-admin";

// GET /api/recruiting/settings — get app settings
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("app_settings")
    .select("key, value")
    .eq("key", "praemie_betrag_default")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Einstellungen konnten nicht geladen werden"},
      { status: 500 }
    );
  }

  return NextResponse.json({
    praemie_betrag_default: Number(data?.value ?? 1000),
  });
}

// PATCH /api/recruiting/settings — update app settings
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

  const { praemie_betrag_default } = body as { praemie_betrag_default?: number };

  if (praemie_betrag_default === undefined || typeof praemie_betrag_default !== "number" || praemie_betrag_default < 0) {
    return NextResponse.json(
      { error: "Ungültiger Prämienbetrag" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("app_settings")
    .upsert({
      key: "praemie_betrag_default",
      value: praemie_betrag_default,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json(
      { error: "Einstellung konnte nicht gespeichert werden"},
      { status: 500 }
    );
  }

  return NextResponse.json({ praemie_betrag_default });
}
