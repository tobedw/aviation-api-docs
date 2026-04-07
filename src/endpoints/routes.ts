import { SupabaseClient } from '@supabase/supabase-js'
import { ok, err, parsePagination } from '../lib/response'
import { PlanLimits } from '../lib/plan'

const SELECT = `
  id, departure_iata, departure_icao, arrival_iata, arrival_icao,
  duration_min, flights_per_week, flights_per_day, price,
  day_mon, day_tue, day_wed, day_thu, day_fri, day_sat, day_sun,
  first_flight, last_flight,
  airlines:route_airlines(
    airline_iata, airline_name, aircraft_codes,
    class_first, class_business, class_economy, lcc, is_new, first_flight
  )
`.trim()

// aircraft_codes in route_airlines is a raw comma-separated string (e.g. "32S,787")
// We keep it as-is — no join to aircraft_types to avoid duplication.
// Callers who need full names can look up /v1/aircraft-types?iata=32S,787

export async function handleRoutes(
  url: URL,
  supabase: SupabaseClient,
  planLimits: PlanLimits,
): Promise<Response> {
  const { limit, offset } = parsePagination(url, planLimits.maxPageSize)
  const departureIata = url.searchParams.get('departureIata')?.toUpperCase()
  const departureIcao = url.searchParams.get('departureIcao')?.toUpperCase()
  const arrivalIata = url.searchParams.get('arrivalIata')?.toUpperCase()
  const airlineIata = url.searchParams.get('airlineIata')?.toUpperCase()

  if (!departureIata && !departureIcao && !arrivalIata && !airlineIata) {
    return err(400, 'At least one filter is required: departureIata, departureIcao, arrivalIata, or airlineIata')
  }

  let query = supabase
    .from('routes')
    .select(SELECT, { count: 'exact' })

  if (departureIata) {
    query = query.eq('departure_iata', departureIata)
  } else if (departureIcao) {
    query = query.eq('departure_icao', departureIcao)
  }

  if (arrivalIata) {
    query = query.eq('arrival_iata', arrivalIata)
  }

  if (airlineIata) {
    query = query.eq('route_airlines.airline_iata', airlineIata)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) return err(500, error.message)
  return ok(data ?? [], count ?? 0, { limit, offset })
}
