import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchTickets, createTicket, type TicketFilter } from '@/lib/database/tickets';
import { ticketSchema } from '@/lib/validations/ticket';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = req.nextUrl;
  const filter: TicketFilter = {
    status: searchParams.get('status') ?? undefined,
    urgency: searchParams.get('urgency') ?? undefined,
    firma: searchParams.get('firma') ?? undefined,
  };

  try {
    const data = await fetchTickets(filter);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[/api/tickets GET]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const parsed = ticketSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Ungültige Eingabe';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { description, assignee_person_id, firma, due_date, ...rest } = parsed.data;
    const ticket = await createTicket(session.companyId, {
      ...rest,
      description: description ?? null,
      assignee_person_id: assignee_person_id ?? null,
      firma: firma ?? null,
      due_date: due_date ?? null,
    });
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('[/api/tickets POST]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
