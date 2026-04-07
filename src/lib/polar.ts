async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function reportUsageToPolar(
  polarApiToken: string | undefined,
  customerId: string,
  metricName = 'data_request',
): Promise<void> {
  if (!polarApiToken || !customerId) return
  try {
    const resp = await fetchWithTimeout(
      'https://api.polar.sh/v1/events/ingest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${polarApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: [
            {
              name: metricName,
              customer_id: customerId,
              metadata: {},
            },
          ],
        }),
      },
      5000,
    )
    if (!resp.ok) console.error('Polar Metering Error:', resp.status)
  } catch (err: unknown) {
    console.error('Polar reportUsage failed:', err instanceof Error ? err.message : err)
  }
}
