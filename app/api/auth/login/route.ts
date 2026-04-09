import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'werkbank-auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request' }, { status: 400 });
  }

  const { password } = body as { password?: string };
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    return NextResponse.json(
      { error: 'Passwort nicht konfiguriert' },
      { status: 500 }
    );
  }

  if (!password || password !== sitePassword) {
    return NextResponse.json(
      { error: 'Falsches Passwort' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE, sitePassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
  });

  return response;
}
