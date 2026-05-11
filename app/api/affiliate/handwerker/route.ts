import { requireAuth, validateOrigin } from '@/lib/modules/affiliate/auth';
import { NextRequest, NextResponse } from "next/server";
import { handwerkerCreateSchema, handwerkerUpdateSchema, paginationSchema } from "@/lib/modules/affiliate/validators";
import { sql } from "@/lib/modules/affiliate/db";
import { logAudit } from "@/lib/modules/affiliate/audit";

// GET /api/affiliate/handwerker — list handwerker or empfehlungen (admin)
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

    const validStatus = status && ["offen", "erledigt", "ausgezahlt"].includes(status) ? status : null;
    const companyFilter = !authResult.isAdmin ? authResult.companyId : null;
    const searchTerm = search ? `%${search.replace(/[%_\\]/g, '\\$&')}%` : null;

    try {
      const [rows, countRows] = await Promise.all([
        sql`
          SELECT
            e.*,
            json_build_object('id', h.id, 'name', h.name, 'email', h.email, 'telefon', h.telefon, 'provision_prozent', h.provision_prozent) AS handwerker
          FROM empfehlungen e
          LEFT JOIN handwerker h ON h.id = e.handwerker_id
          WHERE e.handwerker_id IS NOT NULL
            AND e.stelle_id IS NULL
            AND (${validStatus}::text IS NULL OR e.status = ${validStatus}::text)
            AND (${companyFilter}::text IS NULL OR e.company = ${companyFilter}::text)
            AND (
              ${searchTerm}::text IS NULL
              OR e.kunde_name ILIKE ${searchTerm}::text
              OR e.empfehler_name ILIKE ${searchTerm}::text
              OR e.ref_code ILIKE ${searchTerm}::text
            )
          ORDER BY e.created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `,
        sql`
          SELECT COUNT(*) AS count FROM empfehlungen e
          WHERE e.handwerker_id IS NOT NULL
            AND e.stelle_id IS NULL
            AND (${validStatus}::text IS NULL OR e.status = ${validStatus}::text)
            AND (${companyFilter}::text IS NULL OR e.company = ${companyFilter}::text)
            AND (
              ${searchTerm}::text IS NULL
              OR e.kunde_name ILIKE ${searchTerm}::text
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
      SELECT * FROM handwerker
      WHERE (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
      ORDER BY name
    `;
    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ error: "Handwerker konnten nicht geladen werden" }, { status: 500 });
  }
}

// POST /api/affiliate/handwerker — create new handwerker
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

  const parsed = handwerkerCreateSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    return NextResponse.json({ error: "Validierungsfehler", detail: fieldErrors.join("; ") }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM handwerker WHERE email = ${parsed.data.email} LIMIT 1`;
  if (existing[0]) {
    return NextResponse.json({ error: "E-Mail-Adresse bereits als Handwerker registriert" }, { status: 409 });
  }

  try {
    const [row] = await sql`
      INSERT INTO handwerker (auth_user_id, name, email, telefon, provision_prozent, company)
      VALUES (NULL, ${parsed.data.name}, ${parsed.data.email}, ${parsed.data.telefon || null}, ${parsed.data.provision_prozent}, ${authResult.companyId})
      RETURNING *
    `;

    await logAudit({
      userId: authResult.user.id,
      action: "handwerker.created",
      targetType: "handwerker",
      targetId: (row as { id: string }).id,
      details: { name: parsed.data.name, email: parsed.data.email },
      ipAddress: request.headers.get("x-forwarded-for"),
    });

    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === '23505') {
      return NextResponse.json({ error: "E-Mail-Adresse bereits als Handwerker registriert" }, { status: 409 });
    }
    return NextResponse.json({ error: "Handwerker konnte nicht gespeichert werden" }, { status: 500 });
  }
}

// PATCH /api/affiliate/handwerker — update handwerker
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

  const parsed = handwerkerUpdateSchema.safeParse(updateData);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.format() }, { status: 400 });
  }

  const [before] = await sql`SELECT * FROM handwerker WHERE id = ${id} LIMIT 1`;
  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  const updated = await sql`
    UPDATE handwerker
    SET ${sql(parsed.data)}
    WHERE id = ${id}
      AND (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
    RETURNING *
  `;

  if (!updated[0]) {
    return NextResponse.json({ error: "Handwerker konnte nicht aktualisiert werden" }, { status: 500 });
  }

  await logAudit({
    userId: authResult.user.id,
    action: "handwerker.updated",
    targetType: "handwerker",
    targetId: id,
    details: { before: before || {}, after: parsed.data },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(updated[0]);
}

// DELETE /api/affiliate/handwerker — delete handwerker
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Ungültiger Ursprung" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  const rows = await sql`
    SELECT name FROM handwerker
    WHERE id = ${id}
      AND (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
    LIMIT 1
  `;

  if (!rows[0]) {
    return NextResponse.json({ error: "Handwerker nicht gefunden" }, { status: 404 });
  }

  const hw = rows[0] as { name: string };

  const deleted = await sql`DELETE FROM handwerker WHERE id = ${id} RETURNING id`;
  if (!deleted[0]) {
    return NextResponse.json({ error: "Handwerker konnte nicht gelöscht werden" }, { status: 500 });
  }

  await logAudit({
    userId: authResult.user.id,
    action: "handwerker.deleted",
    targetType: "handwerker",
    targetId: id,
    details: { name: hw.name },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ success: true });
}
