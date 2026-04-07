import { SupabaseClient } from '@supabase/supabase-js'
import { ok, err, parsePagination } from '../lib/response'
import { PlanLimits } from '../lib/plan'

export async function handleAircraftTypes(
  url: URL,
  supabase: SupabaseClient,
  planLimits: PlanLimits,
): Promise<Response> {
  const { limit, offset } = parsePagination(url, planLimits.maxPageSize)
  // ?iata=32S or ?iata=32S,787,350 (comma-separated)
  const iataParam = url.searchParams.get('iata')

  let query = supabase.from('aircraft_types').select('*', { count: 'exact' })

  if (iataParam) {
    const iatas = iataParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    if (iatas.length === 1) {
      query = query.eq('iata', iatas[0])
    } else {
      query = query.in('iata', iatas)
    }
  } else {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error, count } = await query

  if (error) return err(500, error.message)
  return ok(data ?? [], count ?? 0, { limit, offset })
}
