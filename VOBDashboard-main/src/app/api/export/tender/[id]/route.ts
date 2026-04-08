import { NextResponse } from 'next/server'
import { getTenderById } from '@/lib/queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const matches = await getTenderById(id)

  if (matches.length === 0) {
    return NextResponse.json({ error: 'Tender not found' }, { status: 404 })
  }

  return NextResponse.json({ tender: matches[0], allMatches: matches })
}
