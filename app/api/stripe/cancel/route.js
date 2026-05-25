import Stripe from 'stripe'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const user = await User.findById(session.userId)
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    if (!user.stripeSubscriptionId) {
      return Response.json({ error: 'No active subscription found' }, { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Cancel at period end so user keeps access until billing cycle ends
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    await User.findByIdAndUpdate(session.userId, { subscriptionActive: false })

    return Response.json({ success: true })
  } catch (err) {
    console.error('[stripe/cancel]', err?.message ?? err)
    return Response.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
