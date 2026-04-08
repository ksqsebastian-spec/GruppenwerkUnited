import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { id, requested } = await request.json()

  if (!id || typeof requested !== 'boolean') {
    return NextResponse.json({ error: 'Missing id or requested boolean' }, { status: 400 })
  }

  const client = getAdminClient() ?? supabase

  const { error } = await client
    .schema('vob').from('vob_tenders')
    .update({ requested })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id, requested })
}
