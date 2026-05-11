import { requireAuth } from '@/lib/modules/recruiting/auth';
import { NextRequest, NextResponse } from "next/server";
import { empfehlungCreateSchema, paginationSchema } from "@/lib/modules/recruiting/validators";
import { checkRateLimit, RATE_LIMITS } from "@/lib/modules/recruiting/rate-limit";
import { sql } from "@/lib/modules/recruiting/db";

const VALID_STATUSES = ["offen", "eingestellt", "probezeit_bestanden", "ausgezahlt"] as const;

function generateRefCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// GET /api/recruiting/referrals — Empfehlungen auflisten
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { searchParams } = request.nextUrl;
  const stelleId = searchParams.get("stelle_id");

  const pagination = paginationSchema.safeParse({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  });

  const page = pagination.success ? pagination.data.page : 1;
  const pageSize = pagination.success ? pagination.data.pageSize : 20;
  const status = searchParams.get("status");
  const offset = (page - 1) * pageSize;

  const validStatus = status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number]) ? status : null;
  const companyFilter = !authResult.isAdmin ? authResult.companyId : null;

  try {
    const [rows, countRows] = await Promise.all([
      sql`
        SELECT * FROM empfehlungen
        WHERE stelle_id IS NOT NULL
          AND handwerker_id IS NULL
          AND (${validStatus}::text IS NULL OR status = ${validStatus}::text)
          AND (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
          AND (${stelleId}::uuid IS NULL OR stelle_id = ${stelleId}::uuid)
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) AS count FROM empfehlungen
        WHERE stelle_id IS NOT NULL
          AND handwerker_id IS NULL
          AND (${validStatus}::text IS NULL OR status = ${validStatus}::text)
          AND (${companyFilter}::text IS NULL OR company = ${companyFilter}::text)
          AND (${stelleId}::uuid IS NULL OR stelle_id = ${stelleId}::uuid)
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

// POST /api/recruiting/referrals — create new empfehlung
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

  const stelleId = (parsed.data as Record<string, unknown>).stelle_id as string | undefined;
  let company = '';
  if (stelleId) {
    const rows = await sql`SELECT company FROM stellen WHERE id = ${stelleId} LIMIT 1`;
    company = (rows[0] as { company: string } | undefined)?.company ?? '';
  }

  const praemieRows = await sql`SELECT value FROM app_settings WHERE key = 'praemie_betrag_default' LIMIT 1`;
  const praemieBetrag = Number((praemieRows[0] as { value: string } | undefined)?.value ?? 1000);

  const refCode = parsed.data.ref_code || generateRefCode();
  const insertData = { ...parsed.data, ref_code: refCode, praemie_betrag: praemieBetrag, company };

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
