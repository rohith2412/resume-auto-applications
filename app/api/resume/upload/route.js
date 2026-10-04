import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { uploadFile, deleteFile } from '@/lib/s3'
import { join } from 'path'
import { createRequire } from 'module'

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

    // Parse text from PDF for AI tailoring
    const req = createRequire(join(process.cwd(), 'index.js'))
    const parsePdf = req(join(process.cwd(), 'lib/parsePdf.cjs'))
    const resumeText = await parsePdf(buffer)

    await connectDB()
    const user = await User.findById(session.userId).select('resumeKey')
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    // Delete old resume from R2 if replacing
    if (user.resumeKey) {
      try { await deleteFile(user.resumeKey) } catch {}
    }

    // Upload to Cloudflare R2
    const key = `resumes/${session.userId}/${Date.now()}.pdf`
    const url = await uploadFile(key, buffer, 'application/pdf')

    // Save everything to MongoDB
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
