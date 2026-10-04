import Stripe from 'stripe'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request) {
  try {
    const { sessionId } = await request.json()
    if (!sessionId) return Response.json({ error: 'Missing session_id' }, { status: 400 })

    const authSession = await getSession()
    if (!authSession) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      return Response.json({ active: false })
    }

    await connectDB()
    const user = await User.findById(authSession.userId).select('stripeCustomerId')
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    if (user.stripeCustomerId && user.stripeCustomerId !== checkoutSession.customer) {
      return Response.json({ error: 'Session does not belong to this account' }, { status: 403 })
    }

    await User.findByIdAndUpdate(authSession.userId, {
      subscriptionActive: true,
      stripeSubscriptionId: checkoutSession.subscription,
      stripeCustomerId: checkoutSession.customer,
    })

    return Response.json({ active: true })
  } catch (err) {
    console.error('[stripe/verify]', err?.message ?? err)
    return Response.json({ error: 'Verification failed' }, { status: 500 })
  }
}
