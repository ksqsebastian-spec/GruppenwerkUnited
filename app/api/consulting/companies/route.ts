import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import {
  fetchConsultingCompanies,
  fetchConsultingCompanyBySlug,
  createConsultingCompany,
} from '@/lib/database/consulting';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const slug = req.nextUrl.searchParams.get('slug');

  try {
    if (slug) {
      const data = await fetchConsultingCompanyBySlug(slug);
      return NextResponse.json(data);
    }
    const data = await fetchConsultingCompanies();
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
    await createConsultingCompany({
      name: body.name,
      slug: body.slug,
      color: body.color ?? null,
      sort_order: body.sort_order ?? 0,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
