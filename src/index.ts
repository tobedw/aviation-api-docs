import { Env, KVApiKey, getSupabase } from './lib/supabase'
import { err, corsHeaders } from './lib/response'
import { reportUsageToPolar } from './lib/polar'
import { getPlanLimits, PlanLimits } from './lib/plan'
import { handleAirlines } from './endpoints/airlines'
import { handleAirports } from './endpoints/airports'
import { handleCities } from './endpoints/cities'
import { handleCountries } from './endpoints/countries'
import { handleRoutes } from './endpoints/routes'
import { handleAircraftTypes } from './endpoints/aircraft_types'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    if (request.method !== 'GET') {
      return err(405, 'Method not allowed')
    }

    // Auth check via KV
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return err(401, 'Unauthorized — provide a valid x-api-key header')
    }

    const raw = await env.API_KEYS_STORE.get(apiKey)
    if (!raw) {
      return err(401, 'Unauthorized — invalid API key')
    }

    let keyData: KVApiKey
    try {
      keyData = JSON.parse(raw)
    } catch {
      return err(500, 'Invalid API key data')
    }

    if (!keyData.active) {
      return err(403, 'API key is inactive')
    }

    if (keyData.usage >= keyData.limit) {
      return err(429, `Request limit reached (${keyData.limit} requests/month)`)
    }

    // Increment usage + report to Polar (fire-and-forget)
    keyData.usage += 1
    env.API_KEYS_STORE.put(apiKey, JSON.stringify(keyData))
    reportUsageToPolar(env.POLAR_API_TOKEN, keyData.customer_id)

    const planLimits = getPlanLimits(keyData.plan)

    // Rate limit headers
    const resetDate = new Date()
    resetDate.setUTCMonth(resetDate.getUTCMonth() + 1, 1)
    resetDate.setUTCHours(0, 0, 0, 0)
    const rateLimitHeaders = {
      'X-RateLimit-Limit': String(keyData.limit),
      'X-RateLimit-Remaining': String(Math.max(0, keyData.limit - keyData.usage)),
      'X-RateLimit-Reset': resetDate.toISOString().slice(0, 10),
    }

    const addRateLimitHeaders = (response: Response): Response => {
      const newHeaders = new Headers(response.headers)
      for (const [k, v] of Object.entries(rateLimitHeaders)) newHeaders.set(k, v)
      return new Response(response.body, { status: response.status, headers: newHeaders })
    }

    const supabase = getSupabase(env)
    const path = url.pathname.replace(/\/$/, '')

    // Route
    if (path === '/v1/airlines') return addRateLimitHeaders(await handleAirlines(url, supabase, planLimits))
    if (path === '/v1/airports') return addRateLimitHeaders(await handleAirports(url, supabase, planLimits))
    if (path === '/v1/cities') return addRateLimitHeaders(await handleCities(url, supabase, planLimits))
    if (path === '/v1/countries') return addRateLimitHeaders(await handleCountries(url, supabase, planLimits))
    if (path === '/v1/routes') return addRateLimitHeaders(await handleRoutes(url, supabase, planLimits))
    if (path === '/v1/aircraft-types') return addRateLimitHeaders(await handleAircraftTypes(url, supabase, planLimits))

    if (path === '/' || path === '') {
      return Response.json({
        name: 'Aviation Data API',
        version: 'v1',
        endpoints: [
          '/v1/airlines',
          '/v1/airports',
          '/v1/cities',
          '/v1/countries',
          '/v1/routes',
          '/v1/aircraft-types',
        ],
      }, { headers: corsHeaders() })
    }

    return err(404, `Unknown endpoint: ${path}`)
  },
}
