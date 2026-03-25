import express from 'express'
import Message from '../models/Message.js'

const router = express.Router()

// ⚠️ Routes cụ thể phải đặt TRƯỚC route động /:userId

// Đếm tin chưa đọc cho admin (tất cả user)
router.get('/unread/admin', async (req, res) => {
  const msgs = await Message.find({ toId: 'admin' })
  const counts = {}
  for (const m of msgs) {
    if (!m.readBy?.includes('admin')) {
      counts[m.fromId] = (counts[m.fromId] || 0) + 1
    }
  }
  res.json(counts)
})

// Đếm tin chưa đọc cho 1 user cụ thể
router.get('/unread/:userId', async (req, res) => {
  const { userId } = req.params
  const count = await Message.countDocuments({
    fromId: 'admin',
    toId: userId,
    readBy: { $ne: userId }
  })
  res.json({ count })
})

// Đánh dấu đã đọc thread
router.put('/read/:userId', async (req, res) => {
  const { userId } = req.params
  const { readerId } = req.body
  await Message.updateMany(
    {
      $or: [
        { fromId: userId, toId: 'admin' },
        { fromId: 'admin', toId: userId },
      ],
      readBy: { $ne: readerId }
    },
    { $addToSet: { readBy: readerId } }
  )
  res.json({ ok: true })
})

// Lấy messages của 1 thread
router.get('/:userId', async (req, res) => {
  const { userId } = req.params
  const msgs = await Message.find({
    $or: [
      { fromId: userId, toId: 'admin' },
      { fromId: 'admin', toId: userId },
    ]
  }).sort({ createdAt: 1 })
  res.json(msgs.map(m => ({
    id: String(m._id),
    fromId: m.fromId,
    fromName: m.fromName,
    toId: m.toId,
    text: m.text,
    time: m.createdAt,
    readBy: m.readBy || [],
  })))
})

// Gửi tin nhắn
router.post('/', async (req, res) => {
  const { fromId, fromName, toId, text } = req.body
  const msg = await Message.create({ fromId, fromName, toId, text, readBy: [fromId] })
  res.json({
    id: String(msg._id),
    fromId: msg.fromId,
    fromName: msg.fromName,
    toId: msg.toId,
    text: msg.text,
    time: msg.createdAt,
    readBy: msg.readBy,
  })
})

export default router
