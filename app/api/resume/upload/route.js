import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { join } from 'path'
import { createRequire } from 'module'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const resumeFile = formData.get('resume')
    if (!resumeFile || resumeFile.size === 0) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await resumeFile.arrayBuffer())
    const req = createRequire(join(process.cwd(), 'index.js'))
    const parsePdf = req(join(process.cwd(), 'lib/parsePdf.cjs'))
    const resumeText = await parsePdf(buffer)

    await connectDB()
    await User.findByIdAndUpdate(session.userId, { resumeText })

    return Response.json({ success: true })
  } catch (err) {
    console.error('Resume upload error:', err)
    return Response.json({ error: err.message || 'Failed to upload' }, { status: 500 })
  }
}
