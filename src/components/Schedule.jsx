import { useState, useEffect, useRef } from 'react'
import { getUsers, getShifts, getSchedule, saveSchedule, getDayShifts } from '../store'

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getDays(year, month) {
  const days = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1) }
  return days
}

export default function Schedule({ user }) {
  const isAdmin = user.role === 'admin'
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [schedule, setSchedule] = useState(getSchedule())
  const [modal, setModal] = useState(null)

  const shifts = getShifts()
  const users = getUsers().filter(u => u.role === 'user')
  const days = getDays(year, month)
  const dayShifts = getDayShifts()
  const todayRef = useRef(null)

  // Scroll tới ngày hôm nay khi mới vào
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  function getActiveShifts(date) {
    const key = dateKey(date)
    if (!dayShifts[key]) return shifts // mặc định tất cả
    const activeIds = dayShifts[key]
    return shifts.filter(s => activeIds.includes(s.id))
  }

  function prevMonth() { month === 0 ? (setYear(y => y-1), setMonth(11)) : setMonth(m => m-1) }
  function nextMonth() { month === 11 ? (setYear(y => y+1), setMonth(0)) : setMonth(m => m+1) }

  function getAssigned(date, shiftId) { return schedule[dateKey(date)]?.[shiftId] || [] }

  function toggleUser(userId) {
    const key = dateKey(modal.date)
    const cur = schedule[key]?.[modal.shiftId] || []
    const updated = cur.includes(userId) ? cur.filter(id => id !== userId) : [...cur, userId]
    const next = { ...schedule, [key]: { ...(schedule[key] || {}), [modal.shiftId]: updated } }
    setSchedule(next); saveSchedule(next)
  }

  function getUserName(id) { return getUsers().find(u => u.id === id)?.name || '' }

  const isSunday = (d) => d.getDay() === 0
  const isSaturday = (d) => d.getDay() === 6

  return (
    <div style={s.wrap}>
      {/* Điều hướng tháng */}
      <div style={s.monthNav}>
        <button style={s.navBtn} onClick={prevMonth}>‹</button>
        <h2 style={s.monthTitle}>{MONTHS[month]} {year}</h2>
        <button style={s.navBtn} onClick={nextMonth}>›</button>
      </div>

      {/* Chú thích ca */}
      <div style={s.legend}>
        {shifts.map(sh => (
          <span key={sh.id} style={{ ...s.legendItem, background: sh.color + '22', border: `1px solid ${sh.color}66` }}>
            <span style={{ ...s.legendDot, background: sh.color }} />
            {sh.label} · {sh.time}
          </span>
        ))}
        {isAdmin && <span style={s.hintText}>💡 Nhấn vào ca để phân công</span>}
      </div>

      {/* Lưới lịch */}
      <div style={s.grid}>
        {days.map(day => {
          const isToday = dateKey(day) === dateKey(today)
          const weekend = isSunday(day) || isSaturday(day)
          return (
            <div key={dateKey(day)} ref={isToday ? todayRef : null} style={{
              ...s.dayCard,
              ...(isToday ? s.todayCard : {}),
              ...(weekend ? s.weekendCard : {}),
            }}>
              {/* Header ngày */}
              <div style={s.dayHeader}>
                <div style={s.dayLeft}>
                  <span style={{ ...s.dayName, ...(weekend ? s.weekendText : {}) }}>
                    {DAY_NAMES[day.getDay()]}
                  </span>
                  <span style={s.fullDate}>
                    {String(day.getDate()).padStart(2,'0')}/{String(day.getMonth()+1).padStart(2,'0')}/{day.getFullYear()}
                  </span>
                </div>
                <span style={{ ...s.dayNum, ...(isToday ? s.todayNum : weekend ? s.weekendNum : {}) }}>
                  {day.getDate()}
                </span>
              </div>

              {/* Các ca trực */}
              {getActiveShifts(day).map(sh => {
                const assigned = getAssigned(day, sh.id)
                return (
                  <div
                    key={sh.id}
                    style={{ ...s.shiftRow, borderLeft: `3px solid ${sh.color}`, cursor: isAdmin ? 'pointer' : 'default' }}
                    onClick={() => isAdmin && setModal({ date: day, shiftId: sh.id })}
                  >
                    <div style={s.shiftTop}>
                      <span style={{ ...s.shiftLabel, color: sh.color }}>{sh.label}</span>
                      <span style={s.shiftTime}>{isAdmin ? '✏️' : sh.time}</span>
                    </div>
                    <div style={s.assignedList}>
                      {assigned.length === 0
                        ? <span style={s.empty}>Chưa phân công</span>
                        : assigned.map(id => {
                            const name = getUserName(id)
                            if (!name) return null
                            return <span key={id} style={s.badge}>{name}</span>
                          })
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Modal phân công */}
      {modal && isAdmin && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>
              {getActiveShifts(modal.date).find(sh => sh.id === modal.shiftId)?.label || shifts.find(sh => sh.id === modal.shiftId)?.label}
            </h3>
            <p style={s.modalSub}>
              {DAY_NAMES[modal.date.getDay()]}, ngày {modal.date.getDate()}/{modal.date.getMonth()+1}/{modal.date.getFullYear()}
            </p>
            <div style={s.userList}>
              {users.map(u => {
                const checked = getAssigned(modal.date, modal.shiftId).includes(u.id)
                return (
                  <label key={u.id} style={{ ...s.userRow, ...(checked ? s.userRowChecked : {}) }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleUser(u.id)} style={{ marginRight: 10, accentColor: '#667eea' }} />
                    <span style={s.userRowName}>{u.name}</span>
                    {checked && <span style={s.checkBadge}>✓ Đã phân công</span>}
                  </label>
                )
              })}
            </div>
            <button style={s.closeBtn} onClick={() => setModal(null)}>Đóng</button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .schedule-grid { grid-template-columns: 1fr !important; }
          .month-nav h2 { font-size: 18px !important; }
        }
      `}</style>
    </div>
  )
}

const s = {
  wrap: { padding: '16px' },
  monthNav: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 14 },
  navBtn: { background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 22, fontWeight: 700, lineHeight: 1, flexShrink: 0 },
  monthTitle: { fontSize: 20, fontWeight: 700, color: '#2d3748', minWidth: 160, textAlign: 'center' },
  legend: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, color: '#4a5568' },
  legendDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  hintText: { fontSize: 11, color: '#a0aec0', marginLeft: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 },
  dayCard: { background: '#fff', borderRadius: 10, padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '2px solid transparent' },
  todayCard: { border: '2px solid #667eea', boxShadow: '0 2px 12px rgba(102,126,234,0.2)' },
  weekendCard: { background: '#fffbf0' },
  dayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f0f4f8' },
  dayLeft: { display: 'flex', flexDirection: 'column', gap: 2 },
  dayName: { fontSize: 12, fontWeight: 700, color: '#4a5568' },
  weekendText: { color: '#e53e3e' },
  fullDate: { fontSize: 11, color: '#a0aec0' },
  dayNum: { width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 700, fontSize: 16, color: '#2d3748', flexShrink: 0 },
  todayNum: { background: '#667eea', color: '#fff' },
  weekendNum: { color: '#e53e3e' },
  shiftRow: { padding: '6px 8px', marginBottom: 5, borderRadius: 6, background: '#f7fafc', transition: 'background 0.15s' },
  shiftTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  shiftLabel: { fontSize: 11, fontWeight: 700 },
  shiftTime: { fontSize: 10, color: '#a0aec0' },
  assignedList: { display: 'flex', flexWrap: 'wrap', gap: 3 },
  badge: { background: '#ebf4ff', color: '#3182ce', fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 500 },
  empty: { color: '#cbd5e0', fontSize: 10, fontStyle: 'italic' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 14, padding: '24px 24px 20px', width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#2d3748', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#718096', marginBottom: 18 },
  userList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 },
  userRow: { display: 'flex', alignItems: 'center', padding: '10px 12px', background: '#f7fafc', borderRadius: 8, cursor: 'pointer', fontSize: 14, border: '1.5px solid transparent' },
  userRowChecked: { background: '#f0fff4', border: '1.5px solid #9ae6b4' },
  userRowName: { flex: 1 },
  checkBadge: { background: '#c6f6d5', color: '#276749', fontSize: 11, padding: '2px 8px', borderRadius: 10 },
  closeBtn: { width: '100%', padding: 11, background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 },
}
