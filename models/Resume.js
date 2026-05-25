import mongoose from 'mongoose'

const ExperienceSchema = new mongoose.Schema({
  company:   { type: String, default: '' },
  title:     { type: String, default: '' },
  location:  { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate:   { type: String, default: '' },
  current:   { type: Boolean, default: false },
  bullets:   [{ type: String }],
}, { _id: true })

const EducationSchema = new mongoose.Schema({
  institution:    { type: String, default: '' },
  degree:         { type: String, default: '' },
  gpa:            { type: String, default: '' },
  graduationYear: { type: String, default: '' },
  courses:        { type: String, default: '' },
}, { _id: true })

const ProjectSchema = new mongoose.Schema({
  name:         { type: String, default: '' },
  technologies: { type: String, default: '' },
  url:          { type: String, default: '' },
  bullets:      [{ type: String }],
}, { _id: true })

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:     { type: String, default: 'Untitled Resume' },
  template: { type: String, default: 'classic', enum: ['classic', 'modern', 'minimal'] },

  personalInfo: {
    fullName:  { type: String, default: '' },
    email:     { type: String, default: '' },
    phone:     { type: String, default: '' },
    location:  { type: String, default: '' },
    linkedin:  { type: String, default: '' },
    github:    { type: String, default: '' },
    portfolio: { type: String, default: '' },
  },

  summary:     { type: String, default: '' },
  experience:  [ExperienceSchema],
  education:   [EducationSchema],

  skills: {
    technical: { type: String, default: '' },
    tools:     { type: String, default: '' },
    languages: { type: String, default: '' },
    soft:      { type: String, default: '' },
  },

  projects:        [ProjectSchema],
  certifications: [{
    name:   { type: String, default: '' },
    issuer: { type: String, default: '' },
    date:   { type: String, default: '' },
  }],

  score: { type: Number, default: null },
  scoreBreakdown: {
    ats:          Number,
    impact:       Number,
    completeness: Number,
    keywords:     Number,
  },
  scoreFeedback: [String],

  coverLetter:             { type: String, default: '' },
  tailoredVersion:         { type: String, default: '' },
  tailoredJobDescription:  { type: String, default: '' },
}, { timestamps: true })

export default mongoose.models.Resume || mongoose.model('Resume', ResumeSchema)
