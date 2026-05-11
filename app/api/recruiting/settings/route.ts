import { requireAdmin, validateOrigin } from '@/lib/modules/recruiting/auth';
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/modules/recruiting/db";

// GET /api/recruiting/settings — get app settings
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const rows = await sql`SELECT value FROM app_settings WHERE key = 'praemie_betrag_default' LIMIT 1`;
    const value = (rows[0] as { value: string } | undefined)?.value;
    return NextResponse.json({ praemie_betrag_default: Number(value ?? 1000) });
  } catch {
    return NextResponse.json({ error: "Einstellungen konnten nicht geladen werden" }, { status: 500 });
  }
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
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const { praemie_betrag_default } = body as { praemie_betrag_default?: number };

  if (
    praemie_betrag_default === undefined ||
    typeof praemie_betrag_default !== "number" ||
    praemie_betrag_default < 0 ||
    praemie_betrag_default > 99999 ||
    !isFinite(praemie_betrag_default)
  ) {
    return NextResponse.json({ error: "Ungültiger Prämienbetrag" }, { status: 400 });
  }

  try {
    await sql`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ('praemie_betrag_default', ${praemie_betrag_default}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
    `;
    return NextResponse.json({ praemie_betrag_default });
  } catch {
    return NextResponse.json({ error: "Einstellung konnte nicht gespeichert werden" }, { status: 500 });
  }
}
