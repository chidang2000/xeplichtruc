// Chạy 1 lần để tạo dữ liệu mặc định: node seed.js
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import Shift from './models/Shift.js'

dotenv.config()
await mongoose.connect(process.env.MONGODB_URI)

// Tạo admin mặc định
const adminExists = await User.findOne({ username: 'admin' })
if (!adminExists) {
  await User.create({ username: 'admin', password: 'admin123', name: 'Quản trị viên', role: 'admin' })
  console.log('✅ Tạo admin: admin / admin123')
}

// Tạo ca mặc định
const shiftCount = await Shift.countDocuments()
if (shiftCount === 0) {
  await Shift.insertMany([
    { shiftId: 'ca-ngay', label: 'Cả Ngày', time: '06:00 - 22:00', color: '#48bb78' },
    { shiftId: 'ca-sang', label: 'Ca Sáng', time: '06:00 - 14:00', color: '#fbbf24' },
    { shiftId: 'ca-chieu', label: 'Ca Chiều', time: '14:00 - 22:00', color: '#60a5fa' },
    { shiftId: 'ca-dem', label: 'Ca Đêm', time: '22:00 - 06:00', color: '#818cf8' },
  ])
  console.log('✅ Tạo 4 ca mặc định')
}

await mongoose.disconnect()
console.log('Done!')
