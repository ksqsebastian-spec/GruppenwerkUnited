import { requireAdmin } from '@/lib/modules/affiliate/auth';
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/modules/affiliate/supabase-admin";

// GET /api/affiliate/export — CSV export of all empfehlungen
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");

  const adminClient = createAdminClient();

  let query = adminClient
    .from("empfehlungen")
    .select("*, handwerker:handwerker_id(name)")
    // Nur Affiliate-Empfehlungen (handwerker_id IS NOT NULL, stelle_id IS NULL)
    .not("handwerker_id", "is", null)
    .is("stelle_id", null)
    .order("created_at", { ascending: false });

  // Nicht-Admins exportieren nur Daten ihrer Firma
  if (!authResult.isAdmin) {
    query = query.eq("company", authResult.companyId);
  }

  if (status && ["offen", "erledigt", "ausgezahlt"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Export fehlgeschlagen" },
      { status: 500 }
    );
  }

  // Build CSV
  const headers = [
    "Ref-Code",
    "Kunde",
    "Kunde Kontakt",
    "Empfehler",
    "Empfehler Email",
    "Handwerker",
    "Status",
    "Rechnungsbetrag",
    "Provision",
    "Ausgezahlt am",
    "Erstellt am",
  ];

  const rows = (data || []).map((row) => {
    const hw = row.handwerker as { name: string } | null;
    return [
      row.ref_code,
      row.kunde_name,
      row.kunde_kontakt || "",
      row.empfehler_name,
      row.empfehler_email,
      hw?.name || "",
      row.status,
      row.rechnungsbetrag ?? "",
      row.provision_betrag ?? "",
      row.ausgezahlt_am || "",
      row.created_at,
    ];
  });

  function escapeCsv(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // Prevent CSV formula injection: Excel/LibreOffice interpret cells starting
    // with =, +, -, @, tab, or CR as formulas. Prefix with apostrophe to force text.
    const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes('\r')) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  }

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="empfehlungen-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
