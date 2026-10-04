import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobDescription } = await request.json()
  if (!jobDescription || jobDescription.trim().length < 20) {
    return Response.json({ error: 'Please paste a job description (at least a few sentences).' }, { status: 400 })
  }

  await connectDB()
  const user = await User.findById(session.userId).select('email profile resumeText jobPreferences education skills')
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const userName = user.profile?.fullName || user.email.split('@')[0]
  const resumeSnippet = user.resumeText ? user.resumeText.slice(0, 3000) : ''

  const prompt = `You are a cold email assistant for job seekers. Given the job description and the candidate's info, do two things:

1. Extract the hiring manager or recruiter's email from the job description if present. If not found, return null for the email.
2. Write a short, professional cold email (3-5 sentences max) from the candidate to the hiring manager expressing interest in the role. Be genuine, not salesy. Mention 1-2 specific things from their resume that are relevant to this role. Keep it concise — hiring managers are busy.

Candidate name: ${userName}
Candidate email: ${user.email}
Candidate location: ${user.profile?.location || 'Not specified'}
Candidate target role: ${user.jobPreferences?.targetRole || 'Not specified'}
Candidate skills: ${user.skills?.technical || ''} ${user.skills?.languages || ''}
Candidate resume excerpt:
${resumeSnippet}

Job description:
${jobDescription.slice(0, 4000)}

Respond in JSON only:
{
  "managerEmail": "email@example.com or null if not found",
  "companyName": "extracted company name",
  "roleName": "extracted role title",
  "subject": "email subject line",
  "body": "the email body (plain text, include greeting and sign-off with candidate name)"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content)
    return Response.json(result)
  } catch (err) {
    console.error('[cold-email/generate]', err?.message ?? err)
    return Response.json({ error: 'Failed to generate email. Try again.' }, { status: 500 })
  }
}
