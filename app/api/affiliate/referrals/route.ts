import { requireAuth } from '@/lib/modules/affiliate/auth';
import { NextRequest, NextResponse } from "next/server";
import { empfehlungCreateSchema, paginationSchema } from "@/lib/modules/affiliate/validators";
import { checkRateLimit, RATE_LIMITS } from "@/lib/modules/affiliate/rate-limit";
import { createAdminClient } from "@/lib/modules/affiliate/supabase-admin";

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

  const adminClient = createAdminClient();

  let query = adminClient
    .from("empfehlungen")
    .select("*", { count: "exact" })
    // Nur Affiliate-Empfehlungen (handwerker_id IS NOT NULL, stelle_id IS NULL)
    .not("handwerker_id", "is", null)
    .is("stelle_id", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  // SICHERHEIT: Nicht-Admins dürfen nur Empfehlungen ihrer Firma sehen
  if (!authResult.isAdmin) {
    query = query.eq("company", authResult.companyId);
  }

  if (status && ["offen", "erledigt", "ausgezahlt"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Daten konnten nicht geladen werden"},
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > offset + pageSize,
  });
}

// POST /api/referrals — create new empfehlung
export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateCheck = checkRateLimit(
    `referral-create:${ip}`,
    RATE_LIMITS.referralCreate
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warte eine Stunde." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateCheck.resetAt - Date.now()) / 1000)
          ),
        },
      }
    );
  }

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
    return NextResponse.json(
      {
        error: "Validierungsfehler",
        details: parsed.error.format(),
      },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  // Generate ref_code if not provided
  let refCode = parsed.data.ref_code;
  if (!refCode) {
    const { data: generated } = await adminClient.rpc("generate_ref_code");
    refCode = generated as string;
  }

  // Firma aus dem Handwerker ableiten (für korrekte Datentrennung)
  const handwerkerId = (parsed.data as Record<string, unknown>).handwerker_id as string | undefined;
  let company = '';
  if (handwerkerId) {
    const { data: hw } = await adminClient
      .from("handwerker")
      .select("company")
      .eq("id", handwerkerId)
      .single();
    company = hw?.company ?? '';
  }

  const { data, error } = await adminClient
    .from("empfehlungen")
    .insert({
      ...parsed.data,
      ref_code: refCode,
      company,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ref-Code bereits vergeben" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Empfehlung konnte nicht erstellt werden"},
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
