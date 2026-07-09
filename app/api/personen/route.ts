import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchPersonen, createPerson } from '@/lib/database/tickets';
import { personSchema } from '@/lib/validations/ticket';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    // Admins sehen alle Personen, Firmen nur ihre eigenen.
    const data = await fetchPersonen(session.isAdmin ? undefined : session.companyId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[/api/personen GET]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const parsed = personSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Ungültige Eingabe';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const email = parsed.data.email ? parsed.data.email : null;
    const person = await createPerson(session.companyId, {
      name: parsed.data.name,
      email,
      rolle: parsed.data.rolle ?? null,
      firma: parsed.data.firma ? parsed.data.firma : null,
    });
    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    console.error('[/api/personen POST]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
