import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import nodemailer from 'nodemailer'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids, linkedin } = await request.json()
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return Response.json({ error: 'No email IDs provided' }, { status: 400 })
  }

  await connectDB()
  const user = await User.findById(session.userId).select('email gmailAppPassword coldEmails resumeUrl profile')
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  if (!user.gmailAppPassword) {
    return Response.json({ error: 'Gmail App Password not set. Go to Edit Profile to add it.' }, { status: 403 })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.email,
      pass: user.gmailAppPassword,
    },
  })

  const results = []

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]

    if (i > 0) await new Promise(r => setTimeout(r, 3000))

    const email = user.coldEmails?.id(id)
    if (!email || !email.recipientEmail) {
      results.push({ id, success: false, error: 'Email not found' })
      continue
    }

    let body = email.body
    if (user.resumeUrl) body += `\n\nResume: ${user.resumeUrl}`
    if (linkedin || user.profile?.linkedin) body += `\nLinkedIn: ${linkedin || user.profile.linkedin}`

    try {
      await transporter.sendMail({
        from: user.email,
        to: email.recipientEmail,
        subject: email.subject,
        text: body,
      })

      email.status = 'sent'
      email.sentAt = new Date()
      results.push({ id, success: true })
    } catch (err) {
      console.error(`[cold-email/send] Failed for ${email.recipientEmail}:`, err.message)
      if (err.message?.includes('Invalid login') || err.message?.includes('Username and Password not accepted')) {
        results.push({ id, success: false, error: 'Invalid App Password. Check it in Edit Profile.' })
        break
      }
      results.push({ id, success: false, error: 'Send failed' })
    }
  }

  await user.save()

  const sent = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return Response.json({ results, sent, failed })
}
