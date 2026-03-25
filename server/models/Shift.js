import mongoose from 'mongoose'

const shiftSchema = new mongoose.Schema({
  shiftId: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  time: { type: String, default: '' },
  color: { type: String, required: true },
}, { timestamps: true })

export default mongoose.model('Shift', shiftSchema)
