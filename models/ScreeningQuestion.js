import mongoose from 'mongoose'

const ScreeningQuestionSchema = new mongoose.Schema({
  normalizedLabel: { type: String, required: true, unique: true, index: true },
  label:           { type: String },          // original label (latest seen)
  type:            { type: String },          // text | select | radio | checkbox | number | date
  options:         [String],                  // available options if any
  bestAnswer:      { type: String },          // most-used successful answer
  answerCounts:    { type: Map, of: Number, default: {} },  // answer → count
  usedCount:       { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.ScreeningQuestion || mongoose.model('ScreeningQuestion', ScreeningQuestionSchema)
