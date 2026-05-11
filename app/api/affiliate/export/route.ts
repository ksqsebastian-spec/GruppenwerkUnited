import { requireAuth } from '@/lib/modules/affiliate/auth';
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/modules/affiliate/db";

// GET /api/affiliate/export — CSV export of all empfehlungen
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const validStatus = status && ["offen", "erledigt", "ausgezahlt"].includes(status) ? status : null;
  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  try {
    const rows = await sql`
      SELECT e.*, h.name AS handwerker_name
      FROM empfehlungen e
      LEFT JOIN handwerker h ON h.id = e.handwerker_id
      WHERE e.handwerker_id IS NOT NULL
        AND e.stelle_id IS NULL
        AND (${validStatus}::text IS NULL OR e.status = ${validStatus}::text)
        AND (${companyFilter}::text IS NULL OR e.company = ${companyFilter}::text)
      ORDER BY e.created_at DESC
    `;

    const headers = [
      "Ref-Code", "Kunde", "Kunde Kontakt", "Empfehler", "Empfehler Email",
      "Handwerker", "Status", "Rechnungsbetrag", "Provision", "Ausgezahlt am", "Erstellt am",
    ];

    function escapeCsv(val: unknown): string {
      if (val === null || val === undefined) return '';
      const str = String(val);
      const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
      if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes('\r')) {
        return `"${safe.replace(/"/g, '""')}"`;
      }
      return safe;
    }

    const csvRows = rows.map((row) => {
      const r = row as Record<string, unknown>;
      return [
        r.ref_code, r.kunde_name, r.kunde_kontakt || "", r.empfehler_name, r.empfehler_email,
        r.handwerker_name || "", r.status, r.rechnungsbetrag ?? "", r.provision_betrag ?? "",
        r.ausgezahlt_am || "", r.created_at,
      ].map(escapeCsv).join(",");
    });

    const csv = [headers.map(escapeCsv).join(","), ...csvRows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="empfehlungen-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export fehlgeschlagen" }, { status: 500 });
  }
}
