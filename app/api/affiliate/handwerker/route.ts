import { requireAdmin } from '@/lib/modules/affiliate/auth';
import { validateOrigin } from '@/lib/modules/affiliate/auth';
import { NextRequest, NextResponse } from "next/server";
import { handwerkerCreateSchema, handwerkerUpdateSchema, paginationSchema } from "@/lib/modules/affiliate/validators";
import { createAdminClient } from "@/lib/modules/affiliate/supabase-admin";
import { logAudit } from "@/lib/modules/affiliate/audit";

// GET /api/affiliate/handwerker — list handwerker or empfehlungen (admin)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const { searchParams } = request.nextUrl;
  const view = searchParams.get("view");
  const adminClient = createAdminClient();

  // View: all empfehlungen with handwerker info (for admin dashboard / payouts)
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
      .select("*, handwerker:handwerker_id(id, name, email, telefon, provision_prozent)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (status && ["offen", "erledigt", "ausgezahlt"].includes(status)) {
      query = query.eq("status", status);
    }

    if (search) {
      // Sicherheit: Sonderzeichen escapen, die PostgREST-Filter manipulieren könnten
      const sanitized = search.replace(/[%_\\.,()]/g, '');
      if (sanitized.length > 0) {
        query = query.or(
          `kunde_name.ilike.%${sanitized}%,empfehler_name.ilike.%${sanitized}%,ref_code.ilike.%${sanitized}%`
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

  // Default: list all handwerker
  const { data, error } = await adminClient
    .from("handwerker")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: "Handwerker konnten nicht geladen werden"},
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data || [] });
}

// POST /api/affiliate/handwerker — create new handwerker
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

  const parsed = handwerkerCreateSchema.safeParse(body);
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

  // Create Supabase Auth user for this handwerker (Magic Link based)
  const { data: authUser, error: authError } =
    await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      email_confirm: true,
      app_metadata: { is_admin: false },
    });

  if (authError) {
    if (authError.message.includes("already")) {
      return NextResponse.json(
        { error: "E-Mail-Adresse bereits registriert" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        error: "Auth-Benutzer konnte nicht erstellt werden",
        detail: authError.message,
      },
      { status: 500 }
    );
  }

  // Insert handwerker record
  const { data, error } = await adminClient
    .from("handwerker")
    .insert({
      auth_user_id: authUser.user.id,
      name: parsed.data.name,
      email: parsed.data.email,
      telefon: parsed.data.telefon || null,
      provision_prozent: parsed.data.provision_prozent,
    })
    .select()
    .single();

  if (error) {
    // Clean up auth user if DB insert fails
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json(
      {
        error: "Handwerker konnte nicht in DB erstellt werden",
        
      },
      { status: 500 }
    );
  }

  await logAudit({
    userId: authResult.user.id,
    action: "handwerker.created",
    targetType: "handwerker",
    targetId: data.id,
    details: { name: parsed.data.name, email: parsed.data.email },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/affiliate/handwerker — update handwerker
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

  const parsed = handwerkerUpdateSchema.safeParse(updateData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  // Get current values for audit trail
  const { data: before } = await adminClient
    .from("handwerker")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await adminClient
    .from("handwerker")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Handwerker konnte nicht aktualisiert werden" },
      { status: 500 }
    );
  }

  await logAudit({
    userId: authResult.user.id,
    action: "handwerker.updated",
    targetType: "handwerker",
    targetId: id,
    details: {
      before: before || {},
      after: parsed.data,
    },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(data);
}

// DELETE /api/affiliate/handwerker — delete handwerker
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

  // Get handwerker to find auth_user_id
  const { data: hw, error: fetchError } = await adminClient
    .from("handwerker")
    .select("auth_user_id, name")
    .eq("id", id)
    .single();

  if (fetchError || !hw) {
    return NextResponse.json(
      { error: "Handwerker nicht gefunden" },
      { status: 404 }
    );
  }

  // Delete handwerker record
  const { error } = await adminClient
    .from("handwerker")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Handwerker konnte nicht gelöscht werden"},
      { status: 500 }
    );
  }

  // Clean up auth user
  if (hw.auth_user_id) {
    await adminClient.auth.admin.deleteUser(hw.auth_user_id);
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
