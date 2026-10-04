import { cookies } from 'next/headers'
import { randomBytes } from 'node:crypto'

/**
 * GET /api/auth/google
 * Kicks off the Google OAuth 2.0 code flow. Generates a `state` nonce,
 * stores it in an httpOnly cookie for CSRF protection, and redirects the
 * user to Google's consent screen.
 */
export async function GET(request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return Response.json({ error: 'Google OAuth is not configured' }, { status: 500 })
  }

  // Build the redirect URI from the incoming request so it works in
  // dev (http://localhost:3000) and prod (https://www.reblet.com) without
  // a hardcoded env var.
  const origin      = new URL(request.url).origin
  const redirectUri = `${origin}/api/auth/google/callback`

  // CSRF-protection nonce
  const state = randomBytes(24).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('g_oauth_state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 10, // 10 minutes
    path:     '/',
  })

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'openid email profile https://www.googleapis.com/auth/gmail.send',
    access_type:   'offline',
    prompt:        'consent',
    state,
  })

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302)
}
