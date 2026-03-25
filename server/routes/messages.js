import express from 'express'
import Message from '../models/Message.js'

const router = express.Router()

// Lấy messages của 1 thread (giữa userId và admin)
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
  })))
})

// Gửi tin nhắn
router.post('/', async (req, res) => {
  const { fromId, fromName, toId, text } = req.body
  const msg = await Message.create({ fromId, fromName, toId, text })
  res.json({
    id: String(msg._id),
    fromId: msg.fromId,
    fromName: msg.fromName,
    toId: msg.toId,
    text: msg.text,
    time: msg.createdAt,
  })
})

// Lấy danh sách user có tin nhắn (cho admin sidebar)
router.get('/threads/list', async (req, res) => {
  const threads = await Message.aggregate([
    { $match: { toId: 'admin' } },
    { $group: { _id: '$fromId', fromName: { $last: '$fromName' }, lastMsg: { $last: '$text' }, lastTime: { $last: '$createdAt' }, count: { $sum: 1 } } },
    { $sort: { lastTime: -1 } }
  ])
  res.json(threads)
})

export default router
