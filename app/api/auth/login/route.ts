import { NextRequest, NextResponse } from 'next/server';
import { matchCompanyByPassword } from '@/lib/auth/companies';
import { SESSION_COOKIE, encodeSession } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/rate-limit';
import { edgeRateLimit } from '@/lib/rate-limit-edge';

// Brute-Force-Schutz: max. 10 Login-Versuche pro 15 Minuten je IP
const LOGIN_RATE_LIMIT = { windowMs: 15 * 60 * 1000, maxRequests: 10 };
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 Tage

export async function POST(request: NextRequest): Promise<NextResponse> {
  // IP für Rate-Limiting bestimmen (x-forwarded-for kommt von Vercel/Proxy)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // Verteiltes Edge-Limit (wirkt auf Workers) + In-Memory-Limit (Dev/Best-Effort).
  const edgeAllowed = await edgeRateLimit('LOGIN_RATE_LIMITER', `login:${ip}`);
  const rate = checkRateLimit(`login:${ip}`, LOGIN_RATE_LIMIT);
  if (!edgeAllowed || !rate.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Login-Versuche. Bitte später erneut versuchen.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request' }, { status: 400 });
  }

  const { password } = body as { password?: string };
  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ error: 'Passwort erforderlich' }, { status: 400 });
  }

  const company = await matchCompanyByPassword(password);
  if (!company) {
    return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 });
  }

  const token = await encodeSession({
    companyId: company.id,
    companyName: company.name,
    isAdmin: company.isAdmin,
  });

  const response = NextResponse.json({
    companyId: company.id,
    companyName: company.name,
    isAdmin: company.isAdmin,
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // 'lax' erlaubt Cookie bei Top-Level-Navigation (notwendig für Login-Redirect-Flow).
    // 'strict' würde z.B. den Login-Flow via Email-Link brechen.
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
