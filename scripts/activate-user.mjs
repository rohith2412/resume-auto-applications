/**
 * One-off script to manually activate a user whose webhook delivery failed.
 * Run: node scripts/activate-user.mjs
 */

import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const CUSTOMER_EMAIL      = 'rohithra75@gmail.com'
const STRIPE_CUSTOMER_ID  = 'cus_UaEqWYzNnYcVuB'
const STRIPE_SUB_ID       = 'sub_1Tb4NIBccUDXJsOGO0g3RGBO'

const UserSchema = new mongoose.Schema({}, { strict: false })
const User = mongoose.models.User || mongoose.model('User', UserSchema)

await mongoose.connect(process.env.MONGODB_URI)

const result = await User.findOneAndUpdate(
  { email: CUSTOMER_EMAIL },
  { subscriptionActive: true, stripeCustomerId: STRIPE_CUSTOMER_ID, stripeSubscriptionId: STRIPE_SUB_ID },
  { new: true }
)

if (result) {
  console.log(`✅  Activated: ${result.email}  (subscriptionActive = true)`)
} else {
  console.log(`⚠️  No user found with email ${CUSTOMER_EMAIL}`)
}

await mongoose.disconnect()
