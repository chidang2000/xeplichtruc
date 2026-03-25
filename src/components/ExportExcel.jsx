import { useState } from 'react'
import * as XLSX from 'xlsx'
import { api } from '../api'

const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
const DAY_NAMES = ['CN','T2','T3','T4','T5','T6','T7']

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getDaysInMonth(year, month) {
  const days = []; const d = new Date(year, month, 1)
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate()+1) }
  return days
}
function getWeekDays(year, month, week) {
  // week: 1-based, trả về 7 ngày của tuần đó trong tháng
  const allDays = getDaysInMonth(year, month)
  const start = (week - 1) * 7
  return allDays.slice(start, start + 7)
}
function weeksInMonth(year, month) {
  return Math.ceil(getDaysInMonth(year, month).length / 7)
}

export default function ExportExcel({ year, month }) {
  const [mode, setMode] = useState('month') // 'month' | 'week'
  const [week, setWeek] = useState(1)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

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
      const days = mode === 'month'
        ? getDaysInMonth(year, month)
        : getWeekDays(year, month, week)

      // Build rows
      const rows = []

      // Header row
      const header = ['Ngày', 'Thứ', 'Ca Trực', 'Nhân Viên']
      rows.push(header)

      for (const day of days) {
        const key = dateKey(day)
        const activeIds = dayShiftsData[key] ? dayShiftsData[key] : allShifts.map(s => s.id)
        const activeShifts = allShifts.filter(s => activeIds.includes(s.id))

        if (activeShifts.length === 0) {
          rows.push([
            `${String(day.getDate()).padStart(2,'0')}/${String(day.getMonth()+1).padStart(2,'0')}/${day.getFullYear()}`,
            DAY_NAMES[day.getDay()],
            '—', '—'
          ])
          continue
        }

        activeShifts.forEach((sh, i) => {
          const assignedIds = scheduleData[key]?.[sh.id] || []
          const assignedNames = assignedIds
            .map(id => users.find(u => u.id === id)?.name)
            .filter(Boolean)
            .join(', ') || 'Chưa phân công'

          rows.push([
            i === 0 ? `${String(day.getDate()).padStart(2,'0')}/${String(day.getMonth()+1).padStart(2,'0')}/${day.getFullYear()}` : '',
            i === 0 ? DAY_NAMES[day.getDay()] : '',
            sh.time ? `${sh.label} (${sh.time})` : sh.label,
            assignedNames,
          ])
        })
      }

      // Tạo worksheet
      const ws = XLSX.utils.aoa_to_sheet(rows)

      // Style độ rộng cột
      ws['!cols'] = [{ wch: 14 }, { wch: 6 }, { wch: 22 }, { wch: 40 }]

      // Merge ô ngày và thứ cho các ca cùng ngày
      const merges = []
      let r = 1 // bỏ qua header
      for (const day of days) {
        const key = dateKey(day)
        const activeIds = dayShiftsData[key] ? dayShiftsData[key] : allShifts.map(s => s.id)
        const count = allShifts.filter(s => activeIds.includes(s.id)).length || 1
        if (count > 1) {
          merges.push({ s: { r, c: 0 }, e: { r: r + count - 1, c: 0 } })
          merges.push({ s: { r, c: 1 }, e: { r: r + count - 1, c: 1 } })
        }
        r += count
      }
      if (merges.length) ws['!merges'] = merges

      const wb = XLSX.utils.book_new()
      const sheetName = mode === 'month'
        ? `Lich_${MONTHS[month].replace(' ','')}_${year}`
        : `Tuan${week}_${MONTHS[month].replace(' ','')}_${year}`
      XLSX.utils.book_append_sheet(wb, ws, sheetName)

      const fileName = mode === 'month'
        ? `LichTruc_${MONTHS[month]}_${year}.xlsx`
        : `LichTruc_Tuan${week}_${MONTHS[month]}_${year}.xlsx`

      XLSX.writeFile(wb, fileName)
      setOpen(false)
    } catch (err) {
      alert('Lỗi xuất file: ' + err.message)
    } finally { setLoading(false) }
  }

  return (
    <>
      <button style={s.exportBtn} onClick={() => setOpen(true)}>
        📊 Xuất Excel
      </button>

      {open && (
        <div style={s.overlay} onClick={() => setOpen(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.title}>📊 Xuất lịch trực ra Excel</h3>
            <p style={s.sub}>{MONTHS[month]} {year}</p>

            <div style={s.modeRow}>
              <button style={{ ...s.modeBtn, ...(mode === 'month' ? s.modeBtnActive : {}) }} onClick={() => setMode('month')}>
                📅 Cả tháng
              </button>
              <button style={{ ...s.modeBtn, ...(mode === 'week' ? s.modeBtnActive : {}) }} onClick={() => setMode('week')}>
                📆 Theo tuần
              </button>
            </div>

            {mode === 'week' && (
              <div style={s.weekRow}>
                <label style={s.label}>Chọn tuần:</label>
                <div style={s.weekBtns}>
                  {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => (
                    <button key={w}
                      style={{ ...s.weekBtn, ...(week === w ? s.weekBtnActive : {}) }}
                      onClick={() => setWeek(w)}
                    >
                      Tuần {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={s.actions}>
              <button style={s.cancelBtn} onClick={() => setOpen(false)}>Hủy</button>
              <button style={s.confirmBtn} onClick={handleExport} disabled={loading}>
                {loading ? '⏳ Đang xuất...' : '⬇️ Tải xuống'}
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
  modal: { background: '#fff', borderRadius: 14, padding: '28px 28px 24px', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  title: { fontSize: 18, fontWeight: 700, color: '#2d3748', marginBottom: 4 },
  sub: { fontSize: 13, color: '#718096', marginBottom: 20 },
  modeRow: { display: 'flex', gap: 10, marginBottom: 20 },
  modeBtn: { flex: 1, padding: '10px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 500, background: '#f7fafc', color: '#4a5568', cursor: 'pointer' },
  modeBtnActive: { border: '2px solid #667eea', background: '#ebf4ff', color: '#667eea', fontWeight: 700 },
  weekRow: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 8 },
  weekBtns: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  weekBtn: { padding: '8px 16px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 500, background: '#f7fafc', color: '#4a5568', cursor: 'pointer' },
  weekBtnActive: { border: '2px solid #667eea', background: '#ebf4ff', color: '#667eea', fontWeight: 700 },
  actions: { display: 'flex', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 11, background: '#edf2f7', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  confirmBtn: { flex: 1, padding: 11, background: '#48bb78', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
}
