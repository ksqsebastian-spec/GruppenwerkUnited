import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { renderPrompt } from '@/lib/database/customers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id: customerId } = await params;

  let body: { prompt_id?: unknown };
  try {
    body = (await req.json()) as { prompt_id?: unknown };
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  if (typeof body.prompt_id !== 'string' || body.prompt_id.length === 0) {
    return NextResponse.json({ error: 'prompt_id erforderlich' }, { status: 400 });
  }

  try {
    const result = await renderPrompt(body.prompt_id, customerId, session.companyId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 400 });
  }
}
