import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  fromId: { type: String, required: true },
  fromName: { type: String, required: true },
  toId: { type: String, required: true },
  text: { type: String, required: true },
  readBy: [{ type: String }], // mảng userId/role đã đọc
}, { timestamps: true })

export default mongoose.model('Message', messageSchema)
