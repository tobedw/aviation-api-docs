import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface KVApiKey {
  customer_id: string
  limit: number
  usage: number
  active: boolean
  plan: string
  last_sync: string
  last_reset_month: string
}

export type Env = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  API_KEYS_STORE: KVNamespace
  POLAR_API_TOKEN?: string
}

let _client: SupabaseClient | null = null

export function getSupabase(env: Env): SupabaseClient {
  if (!_client) {
    _client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
  }
  return _client
}
