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

  const { data, error } = await adminClient
    .from("empfehlungen")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Empfehlung nicht gefunden" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
