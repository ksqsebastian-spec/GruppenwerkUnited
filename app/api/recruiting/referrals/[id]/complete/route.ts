import { requireAuth } from '@/lib/modules/recruiting/auth';
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/modules/recruiting/supabase-admin";
import { logAudit } from "@/lib/modules/recruiting/audit";

// POST /api/referrals/[id]/complete — mark empfehlung as eingestellt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  const adminClient = createAdminClient();

  // Fetch the empfehlung (must be 'offen')
  const { data: empfehlung, error: fetchError } = await adminClient
    .from("empfehlungen")
    .select("*")
    .eq("id", id)
    .eq("status", "offen")
    .single();

  if (fetchError || !empfehlung) {
    return NextResponse.json(
      { error: "Empfehlung nicht gefunden oder bereits bearbeitet" },
      { status: 404 }
    );
  }

  // Use existing praemie_betrag (set at creation from global default)
  // or allow override via request body
  let praemieBetrag = empfehlung.praemie_betrag;
  try {
    const body = await request.json();
    if (body?.praemie_betrag !== undefined) {
      const betrag = Number(body.praemie_betrag);
      if (!isNaN(betrag) && betrag >= 0) {
        praemieBetrag = betrag;
      }
    }
  } catch {
    // No body is fine — use existing praemie_betrag
  }

  // Update status to eingestellt
  const { data: updated, error: updateError } = await adminClient
    .from("empfehlungen")
    .update({
      status: "eingestellt",
      praemie_betrag: praemieBetrag,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "Status konnte nicht aktualisiert werden" },
      { status: 500 }
    );
  }

  await logAudit({
    userId: "admin",
    action: "empfehlung.eingestellt",
    targetType: "empfehlung",
    targetId: id,
    details: {
      praemie_betrag: praemieBetrag,
    },
    ipAddress: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json(updated);
}
