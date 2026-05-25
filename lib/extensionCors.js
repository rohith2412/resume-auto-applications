// Adds CORS headers so the Chrome extension (chrome-extension:// origin) can
// call these routes even from localhost during development.

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function corsOk() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export function corsJson(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: { ...(init.headers || {}), ...CORS_HEADERS },
  })
}
