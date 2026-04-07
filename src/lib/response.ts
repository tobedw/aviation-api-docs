export interface ApiResponse<T = unknown> {
  data: T[]
  total: number
  truncated: boolean
  page?: number
  limit?: number
}

export function ok<T>(
  data: T[],
  total: number,
  { limit, offset }: { limit: number; offset: number },
): Response {
  const body: ApiResponse<T> = {
    data,
    total,
    truncated: total > offset + limit,
    page: Math.floor(offset / limit) + 1,
    limit,
  }
  return Response.json(body, {
    headers: corsHeaders(),
  })
}

export function err(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: corsHeaders() })
}

export function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'x-api-key, Content-Type',
    'Cache-Control': 'private, no-store',
  }
}

export function parsePagination(url: URL, maxPageSize = 500): { limit: number; offset: number } {
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), maxPageSize)
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)
  return {
    limit: isNaN(limit) || limit < 1 ? Math.min(50, maxPageSize) : limit,
    offset: isNaN(offset) || offset < 0 ? 0 : offset,
  }
}
