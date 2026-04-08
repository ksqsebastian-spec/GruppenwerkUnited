import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

export async function POST() {
  const client = getAdminClient() ?? supabase

  // Delete all matches first (cascade should handle it, but be explicit)
  await client.schema('vob').from('vob_matches').delete().neq('id', '')

  // Delete all tenders
  const { error: tenderError } = await client
    .schema('vob').from('vob_tenders')
    .delete()
    .neq('id', '')

  if (tenderError) {
    return NextResponse.json({ error: tenderError.message }, { status: 500 })
  }

  // Delete all scans
  await client.schema('vob').from('vob_scans').delete().neq('id', '')

  return NextResponse.json({ wiped: true })
}
