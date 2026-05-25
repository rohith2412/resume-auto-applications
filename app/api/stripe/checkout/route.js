import Stripe from 'stripe'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

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
    success_url: `${process.env.NEXTAUTH_URL}/paywall?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/paywall`,
  })

  return Response.json({ url: checkoutSession.url })
}
