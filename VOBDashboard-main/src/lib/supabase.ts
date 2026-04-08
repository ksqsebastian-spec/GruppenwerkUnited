import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function createNullClient(): SupabaseClient {
  const nullResult = { data: null, error: null, count: 0 }

  const createChain = (): any => {
    const chain: any = new Proxy(() => createChain(), {
      get(_, prop) {
        if (prop === 'then') {
          return (resolve: (v: any) => any) => resolve(nullResult)
        }
        return () => createChain()
      },
    })
    return chain
  }

  return new Proxy({} as any, {
    get: () => () => createChain(),
  }) as SupabaseClient
}

export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createNullClient()

export const isConfigured = !!(supabaseUrl && supabaseAnonKey)
