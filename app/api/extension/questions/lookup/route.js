import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import ScreeningQuestion from '@/models/ScreeningQuestion'
import { corsJson, corsOk } from '@/lib/extensionCors'

export async function OPTIONS() { return corsOk() }

function normalizeLabel(label = '') {
  return label.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function POST(request) {
  const apiKey = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  if (!apiKey) return corsJson({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await mongoose.connection.collection('users').findOne(
    { apiKey },
    { projection: { _id: 1 } }
  )
  if (!user) return corsJson({ error: 'Invalid API key' }, { status: 401 })

  const { labels = [] } = await request.json()
  if (!labels.length) return corsJson({ answers: [] })

  const normalizedLabels = labels.map(l => normalizeLabel(l))

  const docs = await ScreeningQuestion.find({
    normalizedLabel: { $in: normalizedLabels },
    usedCount: { $gte: 2 },
  }).select('normalizedLabel label bestAnswer usedCount').lean()

  const answers = docs
    .filter(d => d.bestAnswer)
    .map(d => ({
      label:      d.label,
      answer:     d.bestAnswer,
      confidence: d.usedCount,
    }))

  return corsJson({ answers })
}
