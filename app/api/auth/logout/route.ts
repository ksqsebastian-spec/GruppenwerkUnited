import { NextResponse } from 'next/server';

const AUTH_COOKIE = 'werkbank-auth';

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
