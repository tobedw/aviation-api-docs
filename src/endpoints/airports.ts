import { SupabaseClient } from '@supabase/supabase-js'
import { ok, err, parsePagination } from '../lib/response'
import { PlanLimits } from '../lib/plan'

const SELECT = `
  id, iata, icao, name, type,
  latitude, longitude, elevation_ft, timezone,
  website, phone, address, terminals,
  passengers, aircraft_movements, cargo_tonnes,
  hub_for, description, image_1, image_2, wikipedia_url, active,
  city:cities!city_iata_code(iata_code, city_name, latitude, longitude),
  country:countries!country_code(code2, name, continent_code)
`.trim()

export async function handleAirports(
  url: URL,
  supabase: SupabaseClient,
  planLimits: PlanLimits,
): Promise<Response> {
  const { limit, offset } = parsePagination(url, planLimits.maxPageSize)
  const iataParam = url.searchParams.get('iata')?.toUpperCase()
  const icao = url.searchParams.get('icao')?.toUpperCase()
  const cityName = url.searchParams.get('city_name')
  const countryCode = url.searchParams.get('country_code')?.toUpperCase()
  const majorOnly = url.searchParams.get('major_only') === '1'

  // Multi-IATA: ?iata=LHR,CDG,JFK
  const iatas = iataParam ? iataParam.split(',').map(s => s.trim()).filter(Boolean) : []

  let query = supabase
    .from('airports')
    .select(SELECT, { count: 'exact' })

  if (iatas.length === 1) {
    query = query.eq('iata', iatas[0])
  } else if (iatas.length > 1) {
    query = query.in('iata', iatas)
  } else if (icao) {
    query = query.eq('icao', icao)
  }

  if (cityName) {
    // First resolve matching city IATA codes, then filter airports
    const { data: cityRows } = await supabase
      .from('cities')
      .select('iata_code')
      .ilike('city_name', `%${cityName}%`)
    const cityIatas = (cityRows ?? []).map((c: any) => c.iata_code).filter(Boolean)
    if (cityIatas.length === 0) return ok([], 0, { limit, offset })
    query = query.in('city_iata_code', cityIatas)
  }

  if (countryCode) {
    query = query.eq('country_code', countryCode)
  }

  if (majorOnly) {
    query = query.eq('type', 'large_airport')
  }

  // Free plan: require at least one filter for bulk queries
  const isBulk = iatas.length === 0 && !icao && !cityName && !countryCode
  if (isBulk && planLimits.requireFilter) {
    return err(403, 'Bulk download requires a paid plan — add a filter (iata, icao, city_name, country_code) or upgrade')
  }

  // Pagination for multi/bulk queries
  if (iatas.length !== 1 && !icao) {
    query = query
      .order('passengers', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)
  }

  const { data, error, count } = await query

  if (error) return err(500, error.message)
  return ok(data ?? [], count ?? 0, { limit, offset })
}
