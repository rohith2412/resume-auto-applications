import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import ScreeningQuestion from '@/models/ScreeningQuestion'
import { corsJson, corsOk } from '@/lib/extensionCors'

export async function OPTIONS(request) { return corsOk(request) }

function normalizeLabel(label = '') {
  return label.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

const PII_LABEL = /\b(first.?name|last.?name|full.?name|email|phone|mobile|linkedin.*url|github.*url)\b/i

const PII_ANSWER = /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i
  || /^\+?[\d\s\-().]{7,}$/
  || /^https?:\/\//i

function looksLikePII(label, answer, type) {
  if (PII_LABEL.test(label)) return true
  if (PII_ANSWER.test(answer)) return true
  if ((type === 'text' || type === 'textarea') && answer.length > 120) return true
  return false
}

export async function POST(request) {
  const apiKey = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  if (!apiKey) return corsJson(request, { error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await mongoose.connection.collection('users').findOne(
    { apiKey },
    { projection: { _id: 1 } }
  )
  if (!user) return corsJson(request, { error: 'Invalid API key' }, { status: 401 })

  const { questions = [] } = await request.json()

  let saved = 0
  for (const q of questions) {
    const { label, type, options, answer } = q
    if (!label || !answer) continue
    if (looksLikePII(label, answer, type)) continue

    const normalizedLabel = normalizeLabel(label)
    if (!normalizedLabel) continue

    try {
      let doc = await ScreeningQuestion.findOne({ normalizedLabel })

      if (!doc) {
        doc = new ScreeningQuestion({
          normalizedLabel,
          label,
          type,
          options: options || [],
          usedCount: 0,
          answerCounts: {},
        })
      }

      doc.label   = label
      doc.type    = type   || doc.type
      doc.options = (options && options.length) ? options : doc.options

      doc.usedCount = (doc.usedCount || 0) + 1
      const current = doc.answerCounts.get(answer) || 0
      doc.answerCounts.set(answer, current + 1)

      let bestAns = answer
      let bestCount = 0
      for (const [ans, cnt] of doc.answerCounts.entries()) {
        if (cnt > bestCount) { bestCount = cnt; bestAns = ans }
      }
      doc.bestAnswer = bestAns

      await doc.save()
      saved++
    } catch (e) {
      console.error('questions/save error for label:', normalizedLabel, e.message)
    }
  }

  return corsJson(request, { saved })
}
