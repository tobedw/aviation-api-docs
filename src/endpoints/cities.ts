import { SupabaseClient } from '@supabase/supabase-js'
import { ok, err, parsePagination } from '../lib/response'
import { PlanLimits } from '../lib/plan'

const SELECT = `
  id, iata_code, city_name, state_short, state_full,
  latitude, longitude, timezone, population,
  image_1, image_2, wikipedia_url, website,
  country:countries!country_code(code2, name, continent_code)
`.trim()

export async function handleCities(
  url: URL,
  supabase: SupabaseClient,
  planLimits: PlanLimits,
): Promise<Response> {
  const { limit, offset } = parsePagination(url, planLimits.maxPageSize)
  const iata = url.searchParams.get('iata')?.toUpperCase()
  const name = url.searchParams.get('name')
  const country = url.searchParams.get('country')?.toUpperCase()

  const isBulk = !iata && !name && !country
  if (isBulk && planLimits.requireFilter) {
    return err(403, 'Bulk download requires a paid plan — add a filter (iata, name, country) or upgrade')
  }

  let query = supabase
    .from('cities')
    .select(SELECT, { count: 'exact' })

  if (iata) {
    query = query.eq('iata_code', iata)
  } else if (name) {
    query = query.ilike('city_name', `%${name}%`)
      .range(offset, offset + limit - 1)
  } else if (country) {
    query = query.eq('country_code', country)
      .range(offset, offset + limit - 1)
  } else {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error, count } = await query

  if (error) return err(500, error.message)
  return ok(data ?? [], count ?? 0, { limit, offset })
}
