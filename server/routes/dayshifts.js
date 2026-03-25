import express from 'express'
import DayShift from '../models/DayShift.js'

const router = express.Router()

// Lấy dayShifts theo tháng: ?year=2026&month=3
router.get('/', async (req, res) => {
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
router.put('/:date', async (req, res) => {
  const { activeShiftIds } = req.body
  const entry = await DayShift.findOneAndUpdate(
    { date: req.params.date },
    { activeShiftIds },
    { upsert: true, new: true }
  )
  res.json({ date: entry.date, activeShiftIds: entry.activeShiftIds })
})

export default router
