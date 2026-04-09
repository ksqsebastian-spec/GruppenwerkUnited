import { requireAuth } from '@/lib/modules/affiliate/auth';
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/modules/affiliate/supabase-admin";

// GET /api/affiliate/referrals/[id] — einzelne Empfehlung abrufen
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
    .eq("id", id);

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
