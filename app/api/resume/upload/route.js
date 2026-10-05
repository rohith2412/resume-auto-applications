import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('resume')

    if (!file || typeof file === 'string' || file.size === 0) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ error: 'File too large - max 5 MB' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
      return Response.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    let resumeText = ''
    try {
      const result = await pdfParse(buffer)
      resumeText = result.text.trim()
    } catch (parseErr) {
      console.error('[resume/upload] PDF parse failed, uploading without text:', parseErr.message)
    }

    await connectDB()
    const user = await User.findById(session.userId)
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    user.resumeText     = resumeText
    user.resumeFilename = file.name
    user.resumeUrl      = undefined
    user.resumeKey      = undefined
    await user.save()

    return Response.json({ success: true, filename: file.name })
  } catch (err) {
    console.error('[resume/upload]', err?.message ?? err)
    return Response.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
