import express from 'express'
import User from '../models/User.js'
import Schedule from '../models/Schedule.js'

const router = express.Router()

// Lấy tất cả user
router.get('/', async (req, res) => {
  const users = await User.find({}, '-password')
  res.json(users.map(u => ({ id: u._id, username: u.username, name: u.name, role: u.role })))
})

// Thêm user
router.post('/', async (req, res) => {
  const { username, password, name } = req.body
  if (!username || !password || !name) return res.status(400).json({ error: 'Thiếu thông tin' })
  const exists = await User.findOne({ username })
  if (exists) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' })
  const user = await User.create({ username, password, name, role: 'user' })
  res.json({ id: user._id, username: user.username, name: user.name, role: user.role })
})

// Sửa user
router.put('/:id', async (req, res) => {
  const { name, username, password } = req.body
  const update = { name, username }
  if (password) update.password = password
  const exists = await User.findOne({ username, _id: { $ne: req.params.id } })
  if (exists) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' })
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
  res.json({ id: user._id, username: user.username, name: user.name, role: user.role })
})

// Xóa user + dọn schedule
router.delete('/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id)
  // Xóa user khỏi tất cả ca trực
  await Schedule.updateMany(
    { userIds: req.params.id },
    { $pull: { userIds: req.params.id } }
  )
  res.json({ ok: true })
})

export default router
