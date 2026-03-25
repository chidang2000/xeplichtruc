import express from 'express'
import User from '../models/User.js'

const router = express.Router()

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = await User.findOne({ username, password })
  if (!user) return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' })
  res.json({ id: user._id, username: user.username, name: user.name, role: user.role })
})

// Register
router.post('/register', async (req, res) => {
  const { username, password, name } = req.body
  if (!username || !password || !name) return res.status(400).json({ error: 'Thiếu thông tin' })
  const exists = await User.findOne({ username })
  if (exists) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' })
  const user = await User.create({ username, password, name, role: 'user' })
  res.json({ id: user._id, username: user.username, name: user.name, role: user.role })
})

export default router
