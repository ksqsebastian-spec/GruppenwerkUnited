import { requireAdmin } from '@/lib/modules/recruiting/auth';
import { validateOrigin } from '@/lib/modules/recruiting/auth';
import { NextRequest, NextResponse } from "next/server";
import { stelleCreateSchema, stelleUpdateSchema, paginationSchema } from "@/lib/modules/recruiting/validators";
import { createAdminClient } from "@/lib/modules/recruiting/supabase-admin";
import { logAudit } from "@/lib/modules/recruiting/audit";

const VALID_STATUSES = ["offen", "eingestellt", "probezeit_bestanden", "ausgezahlt"] as const;

// GET /api/recruiting/stellen — list stellen or empfehlungen (admin)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const { searchParams } = request.nextUrl;
  const view = searchParams.get("view");
  const adminClient = createAdminClient();

  // View: all empfehlungen with stelle info (for admin dashboard / payouts)
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

    let query = adminClient
      .from("empfehlungen")
      .select("*, stelle:stelle_id(id, title)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      query = query.eq("status", status);
    }

    if (search) {
      // Sicherheit: Sonderzeichen escapen, die PostgREST-Filter manipulieren könnten
      const sanitized = search.replace(/[%_\\.,()]/g, '');
      if (sanitized.length > 0) {
        query = query.or(
          `kandidat_name.ilike.%${sanitized}%,empfehler_name.ilike.%${sanitized}%,ref_code.ilike.%${sanitized}%`
        );
      }
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
    });
  }

  // Default: list all stellen
  const { data, error } = await adminClient
    .from("stellen")
    .select("*")
    .order("title");

  if (error) {
    return NextResponse.json(
      { error: "Stellen konnten nicht geladen werden"},
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data || [] });
}

// POST /api/recruiting/stellen — create new stelle
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Ungültiger Ursprung" }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ungültiger Request-Body — JSON konnte nicht gelesen werden." },
      { status: 400 }
    );
  }

  const parsed = stelleCreateSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    return NextResponse.json(
      { error: "Validierungsfehler", detail: fieldErrors.join("; ") },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("stellen")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: "Stelle konnte nicht erstellt werden",
        
      },
      { status: 500 }
    );
  }

  await logAudit({
    userId: authResult.user.id,
    action: "stelle.created",
    targetType: "stelle",
    targetId: data.id,
    details: { title: parsed.data.title },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/recruiting/stellen — update stelle
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

  const { id, ...updateData } = body as { id: string } & Record<string, unknown>;
  if (!id) {
    return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });
  }

  const parsed = stelleUpdateSchema.safeParse(updateData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  const { data: before } = await adminClient
    .from("stellen")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await adminClient
    .from("stellen")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Stelle konnte nicht aktualisiert werden" },
      { status: 500 }
    );
  }

  await logAudit({
    userId: authResult.user.id,
    action: "stelle.updated",
    targetType: "stelle",
    targetId: id,
    details: {
      before: before || {},
      after: parsed.data,
    },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(data);
}

// DELETE /api/recruiting/stellen — delete stelle
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Ungültiger Ursprung" }, { status: 403 });
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: stelle, error: fetchError } = await adminClient
    .from("stellen")
    .select("title")
    .eq("id", id)
    .single();

  if (fetchError || !stelle) {
    return NextResponse.json(
      { error: "Stelle nicht gefunden" },
      { status: 404 }
    );
  }

  const { error } = await adminClient
    .from("stellen")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Stelle konnte nicht gelöscht werden"},
      { status: 500 }
    );
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
