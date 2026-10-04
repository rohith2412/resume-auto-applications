function getAllowedOrigin(request) {
  const origin = request?.headers?.get('origin') || ''
  if (origin.startsWith('chrome-extension://')) return origin
  if (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) return origin
  return ''
}

function corsHeaders(request) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(request),
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  }
}

export function corsOk(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}

export function corsJson(request, data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: { ...(init.headers || {}), ...corsHeaders(request) },
  })
}
