import mongoose from 'mongoose'

const dayShiftSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD
  activeShiftIds: [String], // Ca nào được bật trong ngày này
}, { timestamps: true })

export default mongoose.model('DayShift', dayShiftSchema)
