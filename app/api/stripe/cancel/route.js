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

    // Cancel at period end — user keeps access until billing cycle ends.
    // subscriptionActive stays true; the webhook (customer.subscription.deleted)
    // flips it to false when Stripe actually terminates the subscription.
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    // Store the exact date the subscription will end so the UI can display it.
    const cancelAt = new Date(subscription.current_period_end * 1000)
    await User.findByIdAndUpdate(session.userId, { subscriptionCancelAt: cancelAt })

    return Response.json({ success: true, cancelAt: cancelAt.toISOString() })
  } catch (err) {
    console.error('[stripe/cancel]', err?.message ?? err)
    return Response.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
