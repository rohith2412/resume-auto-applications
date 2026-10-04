const hits = new Map()

const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup(windowMs) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of hits) {
    if (now - entry.start > windowMs) hits.delete(key)
  }
}

export function rateLimit({ max = 10, windowMs = 60_000 } = {}) {
  return function check(request) {
    cleanup(windowMs)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const now = Date.now()
    const entry = hits.get(ip)

    if (!entry || now - entry.start > windowMs) {
      hits.set(ip, { count: 1, start: now })
      return null
    }

    entry.count++
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.start + windowMs - now) / 1000)
      return Response.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    return null
  }
}
