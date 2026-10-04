import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { uploadFile, deleteFile } from '@/lib/s3'
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
      return Response.json({ error: 'File too large — max 5 MB' }, { status: 400 })
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
    const user = await User.findById(session.userId).select('resumeKey')
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    if (user.resumeKey) {
      try { await deleteFile(user.resumeKey) } catch {}
    }

    const key = `resumes/${session.userId}/${Date.now()}.pdf`
    const url = await uploadFile(key, buffer, 'application/pdf')

    user.resumeText     = resumeText
    user.resumeUrl      = url
    user.resumeKey      = key
    user.resumeFilename = file.name
    await user.save()

    return Response.json({ success: true, url, filename: file.name })
  } catch (err) {
    console.error('[resume/upload]', err?.message ?? err)
    return Response.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
