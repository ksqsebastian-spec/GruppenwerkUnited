import { requireAuth, validateOrigin } from '@/lib/modules/recruiting/auth';
import { NextRequest, NextResponse } from "next/server";
import { stelleCreateSchema, stelleUpdateSchema, paginationSchema } from "@/lib/modules/recruiting/validators";
import { sql } from "@/lib/modules/recruiting/db";
import { logAudit } from "@/lib/modules/recruiting/audit";

const VALID_STATUSES = ["offen", "eingestellt", "probezeit_bestanden", "ausgezahlt"] as const;

// GET /api/recruiting/stellen — list stellen or empfehlungen (admin)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { searchParams } = request.nextUrl;
  const view = searchParams.get("view");

  if (view === "empfehlungen") {
    const pagination = paginationSchema.safeParse({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
    });
    const page = pagination.success ? pagination.data.page : 1;
    const pageSize = pagination.success ? pagination.data.pageSize : 25;
    const offset = (page - 1) * pageSize;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const validStatus = status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number]) ? status : null;
    const companyFilter = !authResult.isAdmin ? authResult.companyId : null;
    const searchTerm = search ? `%${search.replace(/[%_\\]/g, '\\$&')}%` : null;

    try {
      const [rows, countRows] = await Promise.all([
        sql`
          SELECT
            e.*,
            json_build_object('id', s.id, 'title', s.title) AS stelle
          FROM empfehlungen e
          LEFT JOIN stellen s ON s.id = e.stelle_id
          WHERE e.stelle_id IS NOT NULL
            AND e.handwerker_id IS NULL
            AND (${validStatus}::text IS NULL OR e.status = ${validStatus}::text)
            AND (${companyFilter}::text IS NULL OR e.company = ${companyFilter}::text)
            AND (
              ${searchTerm}::text IS NULL
              OR e.kandidat_name ILIKE ${searchTerm}::text
              OR e.empfehler_name ILIKE ${searchTerm}::text
              OR e.ref_code ILIKE ${searchTerm}::text
            )
          ORDER BY e.created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `,
        sql`
          SELECT COUNT(*) AS count FROM empfehlungen e
          WHERE e.stelle_id IS NOT NULL
            AND e.handwerker_id IS NULL
            AND (${validStatus}::text IS NULL OR e.status = ${validStatus}::text)
            AND (${companyFilter}::text IS NULL OR e.company = ${companyFilter}::text)
            AND (
              ${searchTerm}::text IS NULL
              OR e.kandidat_name ILIKE ${searchTerm}::text
              OR e.empfehler_name ILIKE ${searchTerm}::text
              OR e.ref_code ILIKE ${searchTerm}::text
            )
        `,
      ]);

      const total = Number((countRows[0] as { count: string }).count);
      return NextResponse.json({ data: rows, total, page, pageSize });
    } catch {
      return NextResponse.json({ error: "Daten konnten nicht geladen werden" }, { status: 500 });
    }
  }

  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  try {
    const rows = await sql`
      SELECT * FROM stellen
      WHERE (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
      ORDER BY title
    `;
    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ error: "Stellen konnten nicht geladen werden" }, { status: 500 });
  }
}

// POST /api/recruiting/stellen — create new stelle
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Ungültiger Ursprung" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body — JSON konnte nicht gelesen werden." }, { status: 400 });
  }

  const parsed = stelleCreateSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    return NextResponse.json({ error: "Validierungsfehler", detail: fieldErrors.join("; ") }, { status: 400 });
  }

  try {
    const [row] = await sql`
      INSERT INTO stellen (title, description, praemie_betrag, company)
      VALUES (${parsed.data.title}, ${parsed.data.description || null}, ${parsed.data.praemie_betrag ?? null}, ${authResult.companyId})
      RETURNING *
    `;

    await logAudit({
      userId: authResult.user.id,
      action: "stelle.created",
      targetType: "stelle",
      targetId: (row as { id: string }).id,
      details: { title: parsed.data.title },
      ipAddress: request.headers.get("x-forwarded-for"),
    });

    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Stelle konnte nicht erstellt werden" }, { status: 500 });
  }
}

// PATCH /api/recruiting/stellen — update stelle
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

  const { id, ...updateData } = body as { id: string } & Record<string, unknown>;
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  const parsed = stelleUpdateSchema.safeParse(updateData);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.format() }, { status: 400 });
  }

  const [before] = await sql`SELECT * FROM stellen WHERE id = ${id} LIMIT 1`;
  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  const updated = await sql`
    UPDATE stellen
    SET ${sql(parsed.data)}
    WHERE id = ${id}
      AND (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
    RETURNING *
  `;

  if (!updated[0]) {
    return NextResponse.json({ error: "Stelle konnte nicht aktualisiert werden" }, { status: 500 });
  }

  await logAudit({
    userId: authResult.user.id,
    action: "stelle.updated",
    targetType: "stelle",
    targetId: id,
    details: { before: before || {}, after: parsed.data },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(updated[0]);
}

// DELETE /api/recruiting/stellen — delete stelle
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Ungültiger Ursprung" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  const rows = await sql`
    SELECT title FROM stellen
    WHERE id = ${id}
      AND (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
    LIMIT 1
  `;

  if (!rows[0]) {
    return NextResponse.json({ error: "Stelle nicht gefunden" }, { status: 404 });
  }

  const stelle = rows[0] as { title: string };

  const deleted = await sql`DELETE FROM stellen WHERE id = ${id} RETURNING id`;
  if (!deleted[0]) {
    return NextResponse.json({ error: "Stelle konnte nicht gelöscht werden" }, { status: 500 });
  }

  await logAudit({
    userId: authResult.user.id,
    action: "stelle.deleted",
    targetType: "stelle",
    targetId: id,
    details: { title: stelle.title },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ success: true });
}
