import { requireAuth } from '@/lib/modules/recruiting/auth';
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/modules/recruiting/supabase-admin";

// GET /api/recruiting/referrals/[id] — einzelne Empfehlung abrufen
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const adminClient = createAdminClient();

  let query = adminClient
    .from("empfehlungen")
    .select("*")
    .eq("id", id)
    // Nur Recruiting-Empfehlungen (stelle_id IS NOT NULL)
    .not("stelle_id", "is", null);

  // SICHERHEIT: Nicht-Admins dürfen nur Empfehlungen ihrer Firma abrufen
  if (!authResult.isAdmin) {
    query = query.eq("company", authResult.companyId);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Empfehlung nicht gefunden" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
