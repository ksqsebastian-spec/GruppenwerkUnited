import { NextRequest, NextResponse } from 'next/server';
import { matchCompanyByPassword } from '@/lib/auth/companies';
import { SESSION_COOKIE, encodeSession } from '@/lib/auth/session';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request' }, { status: 400 });
  }

  const { password } = body as { password?: string };

  if (!password) {
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
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
  });

  return response;
}
