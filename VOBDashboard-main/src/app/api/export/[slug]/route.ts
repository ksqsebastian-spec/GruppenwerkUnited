import { NextResponse } from 'next/server'
import { getCompany, getCompanyTenders } from '@/lib/queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const [company, tenders] = await Promise.all([
    getCompany(slug),
    getCompanyTenders(slug, 'active'),
  ])

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  return NextResponse.json({ company, tenders })
}
