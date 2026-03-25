import mongoose from 'mongoose'

const scheduleSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  shiftId: { type: String, required: true },
  userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })

scheduleSchema.index({ date: 1, shiftId: 1 }, { unique: true })

export default mongoose.model('Schedule', scheduleSchema)
