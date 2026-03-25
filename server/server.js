import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import shiftRoutes from './routes/shifts.js'
import scheduleRoutes from './routes/schedule.js'
import dayShiftRoutes from './routes/dayshifts.js'
import messageRoutes from './routes/messages.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/shifts', shiftRoutes)
app.use('/api/schedule/dayshifts', dayShiftRoutes)
app.use('/api/schedule', scheduleRoutes)
app.use('/api/messages', messageRoutes)

const PORT = process.env.PORT;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(PORT || 5000, () => {
      console.log(`🚀 Server running on port ${PORT || 5000}`)
    })
  })
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1) })
