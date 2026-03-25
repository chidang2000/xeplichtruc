import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  fromId: { type: String, required: true }, // userId hoặc 'admin'
  fromName: { type: String, required: true },
  toId: { type: String, required: true },   // userId hoặc 'admin'
  text: { type: String, required: true },
}, { timestamps: true })

export default mongoose.model('Message', messageSchema)
