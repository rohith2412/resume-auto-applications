import mongoose from 'mongoose'

const ApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobTitle:        { type: String, default: '' },
  company:         { type: String, default: '' },
  jobUrl:          { type: String, default: '' },
  jobDescription:  { type: String, default: '' },
  status: {
    type: String,
    enum: ['applied', 'interview', 'offer', 'rejected'],
    default: 'applied',
  },
  notes: { type: String, default: '' },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true })

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema)
