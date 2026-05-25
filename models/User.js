import mongoose from 'mongoose'

const HistorySchema = new mongoose.Schema({
  jobTitle: String,
  resumeText: String,
  jobDescription: String,
}, { timestamps: true })

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  onboardingComplete: { type: Boolean, default: false },
  subscriptionActive: { type: Boolean, default: false },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },

  profile: {
    fullName: String,
    phone: String,
    location: String,
    linkedin: String,
    github: String,
    portfolio: String,
    summary: String,           // professional summary / elevator pitch
  },

  education: {
    university: String,
    degree: String,            // e.g. B.S. Computer Science
    gpa: String,
    graduationYear: String,
    relevantCourses: String,   // comma-separated
  },

  skills: {
    technical: String,         // comma-separated technical skills
    languages: String,         // programming languages
    tools: String,             // tools & frameworks
    soft: String,              // soft skills
  },

  jobPreferences: {
    targetRole: String,
    experienceLevel: String,
    preferredLocation: String,
    remote: Boolean,
    openToRelocation: Boolean,
    targetCompanies: String,   // comma-separated dream companies
    availableFrom: String,     // e.g. "May 2025" or "Immediately"
    expectedSalary: String,
    // Extension / Auto-Apply fields
    yearsExp: String,          // years of experience (number as string)
    workAuth: String,          // "Yes" / "No"
    sponsorship: String,       // "Yes" / "No"
    noticePeriod: String,      // e.g. "2 weeks"
    keywords: String,          // LinkedIn job title to search
    searchLocation: String,    // LinkedIn search location
    workType: String,          // LinkedIn f_WT: "1"=onsite "2"=remote "3"=hybrid
    linkedinExpLevel: String,  // LinkedIn f_E: "1"=intern "2"=entry "3"=assoc "4"=mid-senior
  },

  // Extension field of study (not in base education schema)
  educationField: String,     // field of study / major

  resumeText: String,
  history: [HistorySchema],
  apiKey: { type: String, index: true },
  captchaApiKey: String,          // 2captcha.com API key for auto-solving reCAPTCHA
}, { timestamps: true })

export default mongoose.models.User || mongoose.model('User', UserSchema)
