import { requireAuth } from '@/lib/modules/affiliate/auth';
import { NextRequest, NextResponse } from "next/server";
import { empfehlungCreateSchema, paginationSchema } from "@/lib/modules/affiliate/validators";
import { checkRateLimit, RATE_LIMITS } from "@/lib/modules/affiliate/rate-limit";
import { sql } from "@/lib/modules/affiliate/db";

function generateRefCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// GET /api/affiliate/referrals — Empfehlungen auflisten
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { searchParams } = request.nextUrl;

  const pagination = paginationSchema.safeParse({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  });

  const page = pagination.success ? pagination.data.page : 1;
  const pageSize = pagination.success ? pagination.data.pageSize : 20;
  const status = searchParams.get("status");
  const offset = (page - 1) * pageSize;

  const validStatus = status && ["offen", "erledigt", "ausgezahlt"].includes(status) ? status : null;
  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  try {
    const [rows, countRows] = await Promise.all([
      sql`
        SELECT * FROM empfehlungen
        WHERE handwerker_id IS NOT NULL
          AND stelle_id IS NULL
          AND (${validStatus}::text IS NULL OR status = ${validStatus}::text)
          AND (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) AS count FROM empfehlungen
        WHERE handwerker_id IS NOT NULL
          AND stelle_id IS NULL
          AND (${validStatus}::text IS NULL OR status = ${validStatus}::text)
          AND (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
      `,
    ]);

    const total = Number((countRows[0] as { count: string }).count);
    return NextResponse.json({
      data: rows,
      total,
      page,
      pageSize,
      hasMore: total > offset + pageSize,
    });
  } catch {
    return NextResponse.json({ error: "Daten konnten nicht geladen werden" }, { status: 500 });
  }
}

// POST /api/referrals — create new empfehlung
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateCheck = checkRateLimit(`referral-create:${ip}`, RATE_LIMITS.referralCreate);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warte eine Stunde." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const parsed = empfehlungCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.format() }, { status: 400 });
  }

  const handwerkerId = (parsed.data as Record<string, unknown>).handwerker_id as string | undefined;
  let company = '';
  if (handwerkerId) {
    const rows = await sql`SELECT company FROM handwerker WHERE id = ${handwerkerId} LIMIT 1`;
    company = (rows[0] as { company: string } | undefined)?.company ?? '';
  }

  const refCode = parsed.data.ref_code || generateRefCode();
  const insertData = { ...parsed.data, ref_code: refCode, company };

  try {
    const [row] = await sql`INSERT INTO empfehlungen ${sql(insertData)} RETURNING *`;
    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === '23505') {
      return NextResponse.json({ error: "Ref-Code bereits vergeben" }, { status: 409 });
    }
    return NextResponse.json({ error: "Empfehlung konnte nicht erstellt werden" }, { status: 500 });
  }
}
