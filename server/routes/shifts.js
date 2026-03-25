import express from 'express'
import Shift from '../models/Shift.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const shifts = await Shift.find()
  res.json(shifts.map(s => ({ id: s.shiftId, label: s.label, time: s.time, color: s.color })))
})

router.post('/', async (req, res) => {
  const { label, time, color } = req.body
  const shiftId = 'ca-' + Date.now()
  const shift = await Shift.create({ shiftId, label, time: time || '', color })
  res.json({ id: shift.shiftId, label: shift.label, time: shift.time, color: shift.color })
})

router.put('/:shiftId', async (req, res) => {
  const { label, time, color } = req.body
  const shift = await Shift.findOneAndUpdate({ shiftId: req.params.shiftId }, { label, time: time || '', color }, { new: true })
  res.json({ id: shift.shiftId, label: shift.label, time: shift.time, color: shift.color })
})

router.delete('/:shiftId', async (req, res) => {
  await Shift.findOneAndDelete({ shiftId: req.params.shiftId })
  res.json({ ok: true })
})

export default router
