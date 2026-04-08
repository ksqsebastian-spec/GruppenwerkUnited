import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { ids } = await request.json()

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No tender IDs provided' }, { status: 400 })
  }

  const client = getAdminClient() ?? supabase

  const { error } = await client
    .schema('vob').from('vob_tenders')
    .delete()
    .in('id', ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: ids.length })
}
