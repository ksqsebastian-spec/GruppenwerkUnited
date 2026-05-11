import { requireAuth } from '@/lib/modules/recruiting/auth';
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/modules/recruiting/db";

const VALID_STATUSES = ["offen", "eingestellt", "probezeit_bestanden", "ausgezahlt"] as const;

// GET /api/recruiting/export — CSV export of all empfehlungen
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const validStatus = status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number]) ? status : null;
  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  try {
    const rows = await sql`
      SELECT e.*, s.title AS stelle_title
      FROM empfehlungen e
      LEFT JOIN stellen s ON s.id = e.stelle_id
      WHERE e.stelle_id IS NOT NULL
        AND e.handwerker_id IS NULL
        AND (${validStatus}::text IS NULL OR e.status = ${validStatus}::text)
        AND (${companyFilter}::text IS NULL OR e.company = ${companyFilter}::text)
      ORDER BY e.created_at DESC
    `;

    const headers = [
      "Ref-Code", "Kandidat", "Kandidat Kontakt", "Empfehler", "Empfehler Email",
      "Stelle", "Position", "Status", "Prämie", "Ausgezahlt am", "Erstellt am",
    ];

    function escapeCsv(val: string | number | null | undefined): string {
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
        r.ref_code, r.kandidat_name, r.kandidat_kontakt || "", r.empfehler_name, r.empfehler_email,
        r.stelle_title || "", r.position || "", r.status, r.praemie_betrag ?? "",
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
