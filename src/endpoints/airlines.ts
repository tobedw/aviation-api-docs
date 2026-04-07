import { SupabaseClient } from '@supabase/supabase-js'
import { ok, err, parsePagination } from '../lib/response'
import { PlanLimits } from '../lib/plan'

export async function handleAirlines(
  url: URL,
  supabase: SupabaseClient,
  planLimits: PlanLimits,
): Promise<Response> {
  const { limit, offset } = parsePagination(url, planLimits.maxPageSize)
  const iataParam = url.searchParams.get('iata')?.toUpperCase()
  const icao = url.searchParams.get('icao')?.toUpperCase()
  const name = url.searchParams.get('name')
  const alliance = url.searchParams.get('alliance')
  const countryCode = url.searchParams.get('country_code')?.toUpperCase()

  // Multi-IATA: ?iata=DL,AA,UA
  const iatas = iataParam ? iataParam.split(',').map(s => s.trim()).filter(Boolean) : []

  // airlines joined with aircraft types via airline_aircraft
  let query = supabase
    .from('airlines')
    .select(
      `*, airline_aircraft(aircraft_types(iata, name))`,
      { count: 'exact' },
    )

  if (iatas.length === 1) {
    query = query.eq('iata', iatas[0])
  } else if (iatas.length > 1) {
    query = query.in('iata', iatas)
  } else if (icao) {
    query = query.eq('icao', icao)
  } else if (name) {
    query = query.ilike('name', `%${name}%`)
  }

  if (alliance) {
    query = query.ilike('alliance', `%${alliance}%`)
  }
  if (countryCode) {
    query = query.eq('country_code', countryCode)
  }

  // Free plan: require at least one filter for bulk queries
  const isBulk = iatas.length === 0 && !icao && !name && !alliance && !countryCode
  if (isBulk && planLimits.requireFilter) {
    return err(403, 'Bulk download requires a paid plan — add a filter (iata, name, alliance, country_code) or upgrade')
  }

  // Apply pagination for bulk/filtered queries (not single-record lookups)
  if (iatas.length !== 1 && !icao) {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error, count } = await query

  if (error) return err(500, error.message)

  // Flatten aircraft_types into a simple array on each airline
  const formatted = (data ?? []).map((airline: any) => {
    const { airline_aircraft, ...rest } = airline
    return {
      ...rest,
      aircraft_types: (airline_aircraft ?? []).map((a: any) => a.aircraft_types).filter(Boolean),
    }
  })

  return ok(formatted, count ?? 0, { limit, offset })
}
