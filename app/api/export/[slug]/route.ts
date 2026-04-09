import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Company, DashboardRow } from '@/lib/modules/vob/types'

/**
 * GET /api/export/[slug]
 * Gibt Unternehmensdaten und zugehörige Ausschreibungen für den PDF-Export zurück.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params

  if (!slug || slug.trim() === '') {
    return NextResponse.json(
      { error: 'Slug ist erforderlich' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Unternehmen laden
  const { data: companyData, error: companyError } = await supabase
    .schema('vob')
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single()

  if (companyError || !companyData) {
    return NextResponse.json(
      { error: 'Unternehmen nicht gefunden' },
      { status: 404 }
    )
  }

  // Ausschreibungen für dieses Unternehmen aus dem Dashboard-View laden
  const { data: tenderData, error: tenderError } = await supabase
    .schema('vob')
    .from('vob_dashboard')
    .select('*')
    .eq('company_slug', slug)
    .order('deadline_date', { ascending: true })

  if (tenderError) {
    console.error('Fehler beim Laden der Ausschreibungen für Export:', tenderError)
    return NextResponse.json(
      { error: 'Ausschreibungen konnten nicht geladen werden' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    company: companyData as Company,
    tenders: (tenderData ?? []) as DashboardRow[],
  })
}
