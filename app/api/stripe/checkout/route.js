import Stripe from 'stripe'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

function baseUrl() {
  const raw = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  if (raw.startsWith('http')) return raw.replace(/\/$/, '')
  if (raw) return `https://${raw.replace(/\/$/, '')}`
  return 'https://reblet.com'
}

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const user = await User.findById(session.userId)
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  let customerId = user.stripeCustomerId

  // Verify the saved customer exists in the current Stripe mode (test vs live IDs differ)
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId)
    } catch {
      // Customer not found in this mode — create a fresh one
      customerId = null
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email })
    customerId = customer.id
    await User.findByIdAndUpdate(session.userId, { stripeCustomerId: customerId })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${baseUrl()}/paywall?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl()}/paywall`,
  })

  return Response.json({ url: checkoutSession.url })
}
