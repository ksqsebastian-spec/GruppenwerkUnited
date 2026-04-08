import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

interface AuthResult {
  user: User;
  isAdmin: boolean;
}

// Verify auth and get user context for API routes
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const supabase = await createServerSupabaseClient();

  // SECURITY: Use getUser() — validates JWT against Supabase Auth server
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

  // SECURITY: Admin flag from app_metadata (not user_metadata)
  const isAdmin = user.app_metadata?.is_admin === true;

  return {
    user,
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

// Collect all allowed origins for CSRF validation
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    origins.push(new URL(appUrl).origin);
  }

  // Vercel sets VERCEL_URL automatically for every deployment (including previews)
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    origins.push(new URL(`https://${vercelUrl}`).origin);
  }

  if (origins.length === 0) {
    origins.push("http://localhost:3000");
  }

  return origins;
}

// Validate request origin to protect against CSRF
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = getAllowedOrigins();

  // For same-origin requests with no origin header (e.g., same-page navigation)
  if (!origin && !referer) return true;

  if (origin) {
    return allowed.includes(origin);
  }

  if (referer) {
    try {
      return allowed.includes(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return false;
}
