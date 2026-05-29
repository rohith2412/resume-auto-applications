import Stripe from 'stripe'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  await connectDB()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const customerId = session.customer
    const subscriptionId = session.subscription

    await User.findOneAndUpdate(
      { stripeCustomerId: customerId },
      { subscriptionActive: true, stripeSubscriptionId: subscriptionId }
    )
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    await User.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      { subscriptionActive: false, subscriptionCancelAt: null }
    )
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object
    await User.findOneAndUpdate(
      { stripeCustomerId: invoice.customer },
      { subscriptionActive: false }
    )
  }

  return new Response('OK', { status: 200 })
}
