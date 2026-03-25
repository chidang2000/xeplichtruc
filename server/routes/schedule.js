import express from 'express'
import Schedule from '../models/Schedule.js'
import DayShift from '../models/DayShift.js'

const router = express.Router()

// Lấy toàn bộ schedule theo tháng: ?year=2025&month=3
router.get('/', async (req, res) => {
  const { year, month } = req.query
  let query = {}
  if (year && month) {
    const pad = String(month).padStart(2, '0')
    query.date = { $regex: `^${year}-${pad}` }
  }
  const entries = await Schedule.find(query)
  // Format: { 'YYYY-MM-DD': { shiftId: [userId,...] } }
  const result = {}
  for (const e of entries) {
    if (!result[e.date]) result[e.date] = {}
    result[e.date][e.shiftId] = e.userIds.map(id => String(id))
  }
  res.json(result)
})

// Cập nhật phân công 1 ca 1 ngày
router.put('/:date/:shiftId', async (req, res) => {
  const { userIds } = req.body
  const entry = await Schedule.findOneAndUpdate(
    { date: req.params.date, shiftId: req.params.shiftId },
    { userIds },
    { upsert: true, new: true }
  )
  res.json({ date: entry.date, shiftId: entry.shiftId, userIds: entry.userIds.map(String) })
})

// Lấy dayShifts theo tháng
router.get('/dayshifts', async (req, res) => {
  const { year, month } = req.query
  let query = {}
  if (year && month) {
    const pad = String(month).padStart(2, '0')
    query.date = { $regex: `^${year}-${pad}` }
  }
  const entries = await DayShift.find(query)
  const result = {}
  for (const e of entries) result[e.date] = e.activeShiftIds
  res.json(result)
})

// Cập nhật dayShifts 1 ngày
router.put('/dayshifts/:date', async (req, res) => {
  const { activeShiftIds } = req.body
  const entry = await DayShift.findOneAndUpdate(
    { date: req.params.date },
    { activeShiftIds },
    { upsert: true, new: true }
  )
  res.json({ date: entry.date, activeShiftIds: entry.activeShiftIds })
})

export default router
