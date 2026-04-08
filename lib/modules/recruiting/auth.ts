import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

// validateOrigin und getAllowedOrigins kommen aus der gemeinsamen Implementierung.
// Re-export für Rückwärtskompatibilität bestehender API-Route-Imports.
export { validateOrigin, getAllowedOrigins } from "@/lib/api-guards";

interface AuthResult {
  user: User;
  isAdmin: boolean;
}

// Prüft Auth und gibt User-Kontext für API-Routen zurück
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

  return { user, isAdmin };
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
