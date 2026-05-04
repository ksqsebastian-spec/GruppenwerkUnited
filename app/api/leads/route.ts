import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchLeads, createLead } from '@/lib/database/leads';
import type { LeadFilter } from '@/lib/database/leads';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = req.nextUrl;
  const filter: LeadFilter = {
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    prioritaet: searchParams.get('prioritaet') ?? undefined,
    branche: searchParams.get('branche') ?? undefined,
  };

  try {
    const data = await fetchLeads(session.companyId, filter);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const lead = await createLead(session.companyId, body);
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
