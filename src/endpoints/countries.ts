import { SupabaseClient } from '@supabase/supabase-js'
import { ok, err, parsePagination } from '../lib/response'
import { PlanLimits } from '../lib/plan'

export async function handleCountries(
  url: URL,
  supabase: SupabaseClient,
  planLimits: PlanLimits,
): Promise<Response> {
  const { limit, offset } = parsePagination(url, planLimits.maxPageSize)
  const code = url.searchParams.get('code')?.toUpperCase()
  const name = url.searchParams.get('name')
  const continent = url.searchParams.get('continent')?.toUpperCase()

  // Countries list is small (252) — allow bulk even for free plan
  let query = supabase
    .from('countries')
    .select('*', { count: 'exact' })

  if (code) {
    query = query.eq('code2', code)
  } else if (name) {
    query = query.ilike('name', `%${name}%`)
  } else if (continent) {
    query = query.eq('continent_code', continent)
      .range(offset, offset + limit - 1)
  } else {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error, count } = await query

  if (error) return err(500, error.message)
  return ok(data ?? [], count ?? 0, { limit, offset })
}
