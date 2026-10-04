import Stripe from 'stripe'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Application from '@/models/Application'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rohithra75@gmail.com'

/**
 * DELETE /api/admin/users/[id]
 * Hard-deletes a user, all their applications, and (best-effort) cancels
 * their active Stripe subscription so we don't keep charging them.
 * Admin-only, gated by ADMIN_EMAIL.
 */
export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const me = await User.findById(session.userId).select('email')
    if (!me || me.email !== ADMIN_EMAIL) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    if (!id) return Response.json({ error: 'Missing user id' }, { status: 400 })

    // Never delete yourself (would lock you out of the admin panel).
    if (String(id) === String(session.userId)) {
      return Response.json({ error: 'Cannot delete your own admin account' }, { status: 400 })
    }

    const target = await User.findById(id).select('email stripeSubscriptionId')
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 })

    // Best-effort: cancel Stripe subscription so we stop billing them.
    if (target.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        await stripe.subscriptions.cancel(target.stripeSubscriptionId)
      } catch (e) {
        // Swallow — subscription may already be canceled or invalid.
        console.warn('[admin delete] stripe cancel failed', e?.message ?? e)
      }
    }

    // Delete applications + the user.
    const appsResult = await Application.deleteMany({ userId: id })
    await User.findByIdAndDelete(id)

    return Response.json({
      success:              true,
      deletedEmail:         target.email,
      deletedApplications:  appsResult.deletedCount || 0,
    })
  } catch (err) {
    console.error('[admin/users DELETE]', err?.message ?? err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
