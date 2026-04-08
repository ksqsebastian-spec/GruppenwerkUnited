import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

// validateOrigin und getAllowedOrigins kommen aus der gemeinsamen Implementierung.
// Re-export für Rückwärtskompatibilität bestehender API-Route-Imports.
export { validateOrigin, getAllowedOrigins } from "@/lib/api-guards";

interface AuthResult {
  user: User;
  /** UUID des Handwerker-Datensatzes; leer wenn Admin ohne Handwerker-Profil */
  handwerkerId: string;
  isAdmin: boolean;
}

// Prüft Auth und gibt User-Kontext inkl. Handwerker-ID für API-Routen zurück
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const supabase = await createServerSupabaseClient();

  // SICHERHEIT: getUser() validiert JWT gegen Supabase Auth-Server
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Nicht authentifiziert" },
      { status: 401 }
    );
  }

  // SICHERHEIT: Admin-Flag aus app_metadata (nicht user_metadata)
  const isAdmin = user.app_metadata?.is_admin === true;

  // Handwerker-Datensatz für diesen User laden
  const adminClient = createAdminClient();
  const { data: handwerker } = await adminClient
    .from("handwerker")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!handwerker && !isAdmin) {
    return NextResponse.json(
      { error: "Kein Handwerker-Profil gefunden" },
      { status: 403 }
    );
  }

  return {
    user,
    handwerkerId: handwerker?.id ?? "",
    isAdmin,
  };
}

export async function requireAdmin(): Promise<
  { user: User; isAdmin: true } | NextResponse
> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (!result.isAdmin) {
    return NextResponse.json(
      { error: "Admin-Berechtigung erforderlich" },
      { status: 403 }
    );
  }

  return { user: result.user, isAdmin: true };
}
