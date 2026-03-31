import { useState } from 'react'
import { api } from '../api'

const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const DAY_FULL = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getDaysInMonth(year, month) {
  const days = []; const d = new Date(year, month, 1)
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate()+1) }
  return days
}
function getWeekDays(year, month, week) {
  const all = getDaysInMonth(year, month)
  // Tìm ngày Thứ 2 đầu tiên của tháng (hoặc ngày 1 nếu không phải CN)
  // Chia tuần theo ISO: T2 → CN
  const firstDay = all[0]
  // Số ngày cần lùi để về T2 đầu tiên
  const firstDow = firstDay.getDay() // 0=CN,1=T2,...
  const offsetToMonday = firstDow === 0 ? -6 : 1 - firstDow
  const firstMonday = new Date(firstDay)
  firstMonday.setDate(firstDay.getDate() + offsetToMonday)

  const start = new Date(firstMonday)
  start.setDate(firstMonday.getDate() + (week - 1) * 7)

  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

function weeksInMonth(year, month) {
  const all = getDaysInMonth(year, month)
  const firstDay = all[0]
  const firstDow = firstDay.getDay()
  const offsetToMonday = firstDow === 0 ? -6 : 1 - firstDow
  const firstMonday = new Date(firstDay)
  firstMonday.setDate(firstDay.getDate() + offsetToMonday)
  const lastDay = all[all.length - 1]
  const diff = Math.ceil((lastDay - firstMonday + 1) / (7 * 24 * 3600 * 1000))
  return Math.max(diff, 1)
}

function drawSchedule(canvas, { days, shifts, schedule, dayShifts, users, month, year, week }) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  // --- Màu sắc chủ đạo ---
  const BG = '#FDE8E8'
  const HEADER_COL = '#667eea'
  const SHIFT_COL = '#a78bfa'
  const CELL_BG = '#FFF8F0'
  const BORDER = '#e2c9c9'
  const TEXT_DARK = '#2d3748'
  const TEXT_WHITE = '#ffffff'

  // --- Layout ---
  const PAD = 28
  const TOP_H = 80       // header title area
  const COL_LABEL_W = 110
  const COLS = days.length
  const COL_W = (W - PAD*2 - COL_LABEL_W) / COLS
  const ROW_H = 90
  const HEADER_ROW_H = 44

  // Tổng chiều cao cần
  const activeShiftsPerDay = days.map(day => {
    const key = dateKey(day)
    const ids = dayShifts[key]
    if (ids === undefined || ids === null) return shifts
    return shifts.filter(s => ids.includes(s.id))
  })
  const maxShifts = Math.max(...activeShiftsPerDay.map(s => s.length), 1)
  canvas.height = TOP_H + HEADER_ROW_H + maxShifts * ROW_H + PAD

  // Vẽ lại sau khi resize
  ctx.clearRect(0, 0, W, canvas.height)

  // --- Background ---
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, canvas.height)

  // --- Tiêu đề ---
  ctx.fillStyle = TEXT_DARK
  ctx.font = 'bold 22px serif'
  ctx.fillText('📅 Lịch Trực Hàng Tuần', PAD, 38)

  ctx.font = '14px sans-serif'
  ctx.fillStyle = '#718096'
  const weekDays = days
  const from = `${String(weekDays[0].getDate()).padStart(2,'0')}/${String(weekDays[0].getMonth()+1).padStart(2,'0')}`
  const to = `${String(weekDays[weekDays.length-1].getDate()).padStart(2,'0')}/${String(weekDays[weekDays.length-1].getMonth()+1).padStart(2,'0')}/${weekDays[weekDays.length-1].getFullYear()}`
  ctx.fillText(`Tuần ${week}  •  ${from} – ${to}  •  ${MONTHS[month]} ${year}`, PAD, 62)

  // --- Header row (ngày) ---
  const tableTop = TOP_H
  const tableLeft = PAD

  // Ô "CA TRỰC"
  roundRect(ctx, tableLeft, tableTop, COL_LABEL_W, HEADER_ROW_H, 8, HEADER_COL)
  ctx.fillStyle = TEXT_WHITE
  ctx.font = 'bold 13px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('CA TRỰC', tableLeft + COL_LABEL_W/2, tableTop + HEADER_ROW_H/2 + 5)

  // Ô ngày
  days.forEach((day, i) => {
    const x = tableLeft + COL_LABEL_W + i * COL_W
    const isWeekend = day.getDay() === 0 || day.getDay() === 6
    roundRect(ctx, x + 2, tableTop, COL_W - 4, HEADER_ROW_H, 8, isWeekend ? '#f87171' : HEADER_COL)
    ctx.fillStyle = TEXT_WHITE
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(DAY_FULL[day.getDay()], x + COL_W/2, tableTop + 18)
    ctx.font = '12px sans-serif'
    ctx.fillText(`${String(day.getDate()).padStart(2,'0')}/${String(day.getMonth()+1).padStart(2,'0')}`, x + COL_W/2, tableTop + 36)
  })

  // --- Rows (ca trực) ---
  for (let si = 0; si < maxShifts; si++) {
    const rowY = tableTop + HEADER_ROW_H + si * ROW_H

    // Lấy ca ở hàng si (lấy ca đầu tiên có trong bất kỳ ngày nào)
    // Dùng shifts[si] làm label hàng
    const shift = shifts[si]
    if (!shift) continue

    // Ô label ca
    roundRect(ctx, tableLeft, rowY + 2, COL_LABEL_W, ROW_H - 4, 8, SHIFT_COL)
    ctx.fillStyle = TEXT_WHITE
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(shift.label, tableLeft + COL_LABEL_W/2, rowY + ROW_H/2 - 6)
    if (shift.time) {
      ctx.font = '11px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(shift.time, tableLeft + COL_LABEL_W/2, rowY + ROW_H/2 + 10)
    }

    // Ô từng ngày
    days.forEach((day, di) => {
      const x = tableLeft + COL_LABEL_W + di * COL_W
      const key = dateKey(day)

      // Kiểm tra ca này có active không
      const activeIds = dayShifts[key]
      const isActive = activeIds === undefined || activeIds === null
        ? true
        : activeIds.includes(shift.id)

      roundRect(ctx, x + 3, rowY + 3, COL_W - 6, ROW_H - 6, 8, isActive ? CELL_BG : '#f0f0f0')

      if (!isActive) {
        ctx.fillStyle = '#cbd5e0'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('—', x + COL_W/2, rowY + ROW_H/2 + 4)
        return
      }

      const assigned = schedule[key]?.[shift.id] || []
      const names = assigned.map(id => users.find(u => u.id === id)?.name).filter(Boolean)

      ctx.fillStyle = TEXT_DARK
      ctx.textAlign = 'center'

      if (names.length === 0) {
        ctx.fillStyle = '#cbd5e0'
        ctx.font = 'italic 12px sans-serif'
        ctx.fillText('Chưa phân công', x + COL_W/2, rowY + ROW_H/2 + 4)
      } else {
        ctx.font = '12px sans-serif'
        ctx.fillStyle = '#3182ce'
        const lineH = 16
        const startY = rowY + ROW_H/2 - ((names.length-1) * lineH)/2 + 4
        names.forEach((name, ni) => {
          ctx.fillText(name, x + COL_W/2, startY + ni * lineH)
        })
      }
    })
  }

  // --- Border ngoài ---
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 2
  ctx.strokeRect(tableLeft, tableTop, COL_LABEL_W + COLS * COL_W, HEADER_ROW_H + maxShifts * ROW_H)

  // --- Footer ---
  ctx.fillStyle = '#a0aec0'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Xếp Lịch Trực App', PAD, canvas.height - 8)
}

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
}

export default function ExportImage({ year, month }) {
  const [open, setOpen] = useState(false)
  const [week, setWeek] = useState(1)
  const [loading, setLoading] = useState(false)
  const totalWeeks = weeksInMonth(year, month)

  async function handleExport() {
    setLoading(true)
    try {
      const [scheduleData, dayShiftsData, allUsers, allShifts] = await Promise.all([
        api.getSchedule(year, month + 1),
        api.getDayShifts(year, month + 1),
        api.getUsers(),
        api.getShifts(),
      ])
      const users = allUsers.filter(u => u.role === 'user')
      const days = getWeekDays(year, month, week)

      const canvas = document.createElement('canvas')
      canvas.width = 1000
      canvas.height = 600 // sẽ được tính lại trong drawSchedule

      drawSchedule(canvas, {
        days, shifts: allShifts, schedule: scheduleData,
        dayShifts: dayShiftsData, users, month, year, week
      })

      const link = document.createElement('a')
      link.download = `LichTruc_Tuan${week}_${MONTHS[month]}_${year}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setOpen(false)
    } catch (err) {
      alert('Lỗi xuất ảnh: ' + err.message)
    } finally { setLoading(false) }
  }

  return (
    <>
      <button style={s.exportBtn} onClick={() => setOpen(true)}>
        🖼️ Xuất ảnh
      </button>

      {open && (
        <div style={s.overlay} onClick={() => setOpen(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.title}>🖼️ Xuất lịch trực theo tuần</h3>
            <p style={s.sub}>{MONTHS[month]} {year}</p>

            <div style={s.weekRow}>
              <label style={s.label}>Chọn tuần:</label>
              <div style={s.weekBtns}>
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
                  const days = getWeekDays(year, month, w)
                  const from = `${String(days[0].getDate()).padStart(2,'0')}/${String(days[0].getMonth()+1).padStart(2,'0')}`
                  const to = days[days.length-1] ? `${String(days[days.length-1].getDate()).padStart(2,'0')}/${String(days[days.length-1].getMonth()+1).padStart(2,'0')}` : ''
                  return (
                    <button key={w}
                      style={{ ...s.weekBtn, ...(week === w ? s.weekBtnActive : {}) }}
                      onClick={() => setWeek(w)}
                    >
                      <span style={{ fontWeight: 700 }}>Tuần {w}</span>
                      <span style={{ fontSize: 11, opacity: 0.8 }}>{from}–{to}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={s.actions}>
              <button style={s.cancelBtn} onClick={() => setOpen(false)}>Hủy</button>
              <button style={s.confirmBtn} onClick={handleExport} disabled={loading}>
                {loading ? '⏳ Đang xuất...' : '⬇️ Tải ảnh PNG'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const s = {
  exportBtn: { background: '#48bb78', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: '#fff', borderRadius: 14, padding: '28px 28px 24px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  title: { fontSize: 18, fontWeight: 700, color: '#2d3748', marginBottom: 4 },
  sub: { fontSize: 13, color: '#718096', marginBottom: 20 },
  weekRow: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 10 },
  weekBtns: { display: 'flex', flexDirection: 'column', gap: 8 },
  weekBtn: { padding: '10px 16px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#f7fafc', color: '#4a5568', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  weekBtnActive: { border: '2px solid #667eea', background: '#ebf4ff', color: '#667eea' },
  actions: { display: 'flex', gap: 10 },
  cancelBtn: { flex: 1, padding: 11, background: '#edf2f7', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  confirmBtn: { flex: 1, padding: 11, background: '#48bb78', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
}
