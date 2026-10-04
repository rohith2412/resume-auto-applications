import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { createSession } from '@/lib/auth'

/**
 * GET /api/auth/google/callback
 * Google redirects here with ?code=…&state=…
 * We:
 *   1. Verify state matches the cookie we set in /api/auth/google
 *   2. Exchange the code for tokens
 *   3. Fetch the user's Google profile
 *   4. Find-or-create the User record
 *   5. Issue our own session cookie
 *   6. Redirect to /applications (or /paywall on first sign-up)
 */
export async function GET(request) {
  const url   = new URL(request.url)
  const code  = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const err   = url.searchParams.get('error')

  const origin      = url.origin
  const redirectUri = `${origin}/api/auth/google/callback`

  // The user cancelled or Google returned an error
  if (err) return Response.redirect(`${origin}/?auth_error=${encodeURIComponent(err)}`, 302)
  if (!code || !state) {
    return Response.redirect(`${origin}/?auth_error=missing_params`, 302)
  }

  // Verify CSRF nonce
  const cookieStore = await cookies()
  const savedState  = cookieStore.get('g_oauth_state')?.value
  cookieStore.delete('g_oauth_state')
  if (!savedState || savedState !== state) {
    return Response.redirect(`${origin}/?auth_error=state_mismatch`, 302)
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return Response.redirect(`${origin}/?auth_error=oauth_not_configured`, 302)
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    })
    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      console.error('[google-callback] token exchange failed', tokenRes.status, body)
      return Response.redirect(`${origin}/?auth_error=token_exchange_failed`, 302)
    }
    const tokenData = await tokenRes.json()
    const { access_token, refresh_token } = tokenData
    console.log('[google-callback] got tokens:', { hasAccess: !!access_token, hasRefresh: !!refresh_token })
    if (!access_token) {
      return Response.redirect(`${origin}/?auth_error=no_access_token`, 302)
    }

    // Fetch profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (!profileRes.ok) {
      return Response.redirect(`${origin}/?auth_error=userinfo_failed`, 302)
    }
    const profile = await profileRes.json()
    // profile = { sub, email, email_verified, name, given_name, family_name, picture, ... }
    const email = (profile.email || '').toLowerCase()
    if (!email || !profile.email_verified) {
      return Response.redirect(`${origin}/?auth_error=email_unverified`, 302)
    }

    await connectDB()

    // Find by googleId first, then by email (link existing password account)
    let user = await User.findOne({ googleId: profile.sub })
    if (user) {
      user.googleAccessToken = access_token
      if (refresh_token) user.googleRefreshToken = refresh_token
      user.avatarUrl = profile.picture || user.avatarUrl
      await user.save()
    } else {
      user = await User.findOne({ email })
      if (user) {
        user.googleId  = profile.sub
        user.googleAccessToken = access_token
        if (refresh_token) user.googleRefreshToken = refresh_token
        user.avatarUrl = profile.picture || user.avatarUrl
        if (!user.profile?.fullName && profile.name) {
          user.profile = { ...(user.profile || {}), fullName: profile.name }
        }
        await user.save()
      } else {
        // Brand-new user
        user = await User.create({
          email,
          password:     null,
          googleId:     profile.sub,
          googleAccessToken: access_token,
          googleRefreshToken: refresh_token || null,
          avatarUrl:    profile.picture || null,
          authProvider: 'google',
          profile: {
            fullName: profile.name || '',
          },
        })
      }
    }

    await createSession(user._id.toString())

    // Always go to /onboarding — it auto-skips to /applications if already done
    return Response.redirect(`${origin}/onboarding`, 302)
  } catch (e) {
    console.error('[google-callback] unexpected error', e?.message ?? e)
    return Response.redirect(`${origin}/?auth_error=server_error`, 302)
  }
}
