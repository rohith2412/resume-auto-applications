import OpenAI from 'openai'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Resume from '@/models/Resume'

export async function POST(request, { params }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const { id } = await params
  await connectDB()

  const resume = await Resume.findOne({ _id: id, userId: session.userId })
  if (!resume) return Response.json({ error: 'Not found' }, { status: 404 })

  const { text, type, context } = await request.json()
  if (!text?.trim()) return Response.json({ error: 'Text required' }, { status: 400 })

  let systemPrompt, userPrompt

  if (type === 'bullet') {
    systemPrompt = 'You are an expert resume writer. Improve the given experience bullet point to be stronger, more impactful, and ATS-friendly. Start with a strong action verb. Quantify impact when possible. Be concise (1-2 lines max). Output ONLY the improved bullet text — no bullet symbol, no commentary.'
    userPrompt = `Role: ${context?.title || 'Professional'} at ${context?.company || 'a company'}\n\nOriginal bullet: ${text}`
  } else if (type === 'summary') {
    systemPrompt = 'You are an expert resume writer. Rewrite this professional summary to be more compelling, specific, and results-oriented. Make it 2-3 concise sentences. Output ONLY the improved summary, no commentary.'
    userPrompt = `Original summary: ${text}`
  } else if (type === 'generate_bullets') {
    systemPrompt = 'You are an expert resume writer. Based on the job title and description, generate 3-4 strong resume bullet points. Each bullet must start with a powerful action verb and ideally quantify impact. Output ONLY the bullets, one per line, no bullet symbol prefix.'
    userPrompt = `Job title: ${context?.title || 'Professional'}\nCompany: ${context?.company || ''}\n\nJob description or notes: ${text}`
  } else {
    systemPrompt = 'You are an expert resume writer. Improve the following text to be more professional, impactful, and concise. Output ONLY the improved text, no commentary.'
    userPrompt = text
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 400,
  })

  return Response.json({ improved: completion.choices[0].message.content.trim() })
}
