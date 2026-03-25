import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import ExportExcel from './ExportExcel'
import UserBar from './UserBar'

const DAY_NAMES = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7']
const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getDays(year, month) {
  const days = []; const d = new Date(year, month, 1)
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate()+1) }
  return days
}

export default function Schedule({ user }) {
  const isAdmin = user.role === 'admin'
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [shifts, setShifts] = useState([])
  const [users, setUsers] = useState([])
  const [schedule, setSchedule] = useState({})
  const [dayShifts, setDayShifts] = useState({})
  const [modal, setModal] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const todayRef = useRef(null)

  useEffect(() => {
    Promise.all([api.getUsers(), api.getShifts()]).then(([u, s]) => {
      setUsers(u.filter(x => x.role === 'user'))
      setShifts(s)
    })
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      api.getSchedule(year, month + 1),
      api.getDayShifts(year, month + 1),
    ]).then(([sched, ds]) => {
      if (!active) return
      setSchedule(sched); setDayShifts(ds); setLoading(false)
    }).catch(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [year, month])

  useEffect(() => {
    if (!loading && todayRef.current && year === today.getFullYear() && month === today.getMonth()) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [loading, year, month])

  const days = getDays(year, month)

  function getActiveShifts(date) {
    const key = dateKey(date)
    // Nếu chưa có config cho ngày này → hiện tất cả
    if (dayShifts[key] === undefined || dayShifts[key] === null) return shifts
    // Nếu có config → chỉ hiện ca trong danh sách (kể cả rỗng)
    return shifts.filter(s => dayShifts[key].includes(s.id))
  }
  function getAssigned(date, shiftId) { return schedule[dateKey(date)]?.[shiftId] || [] }
  function getUserName(id) { return users.find(u => u.id === id)?.name || null }

  async function toggleUser(userId) {
    const key = dateKey(modal.date)
    const cur = getAssigned(modal.date, modal.shiftId)
    const updated = cur.includes(userId) ? cur.filter(id => id !== userId) : [...cur, userId]
    await api.updateSchedule(key, modal.shiftId, updated)
    setSchedule(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [modal.shiftId]: updated } }))
  }

  function prevMonth() { month === 0 ? (setYear(y => y-1), setMonth(11)) : setMonth(m => m-1) }
  function nextMonth() { month === 11 ? (setYear(y => y+1), setMonth(0)) : setMonth(m => m+1) }

  return (
    <>
      {/* Thanh sticky cho user */}
      {!isAdmin && (
        <UserBar
          user={user} year={year} month={month}
          days={days} schedule={schedule} dayShifts={dayShifts} shifts={shifts}
        />
      )}

      <div className="schedule-wrap" style={s.wrap}>
        {/* Điều hướng tháng */}
        <div className="month-nav" style={s.monthNav}>
          <button style={s.navBtn} onClick={prevMonth}>‹</button>
          <h2 style={s.monthTitle}>{MONTHS[month]} {year}</h2>
          <button style={s.navBtn} onClick={nextMonth}>›</button>
          <ExportExcel year={year} month={month} />
        </div>

        {/* Chú thích ca */}
        <div className="legend" style={s.legend}>
          {shifts.map(sh => (
            <span key={sh.id} style={{ ...s.legendItem, background: sh.color+'22', border: `1px solid ${sh.color}66` }}>
              <span style={{ ...s.legendDot, background: sh.color }} />
              {sh.label}{sh.time ? ` · ${sh.time}` : ''}
            </span>
          ))}
          {isAdmin && <span style={s.hintText}>💡 Nhấn vào ca để phân công</span>}
        </div>

        {loading ? (
          <div style={s.loadingWrap}>⏳ Đang tải lịch...</div>
        ) : (
          <div className="schedule-grid" style={s.grid}>
            {days.map(day => {
              const isToday = dateKey(day) === dateKey(today)
              const weekend = day.getDay() === 0 || day.getDay() === 6
              return (
                <div key={dateKey(day)} ref={isToday ? todayRef : null}
                  style={{ ...s.dayCard, ...(isToday ? s.todayCard : {}), ...(weekend ? s.weekendCard : {}) }}>
                  <div style={s.dayHeader}>
                    <div style={s.dayLeft}>
                      <span style={{ ...s.dayName, ...(weekend ? s.weekendText : {}) }}>{DAY_NAMES[day.getDay()]}</span>
                      <span style={s.fullDate}>{String(day.getDate()).padStart(2,'0')}/{String(day.getMonth()+1).padStart(2,'0')}/{day.getFullYear()}</span>
                    </div>
                    <span style={{ ...s.dayNum, ...(isToday ? s.todayNum : weekend ? s.weekendNum : {}) }}>{day.getDate()}</span>
                  </div>
                  {getActiveShifts(day).map(sh => {
                    const assigned = getAssigned(day, sh.id)
                    return (
                      <div key={sh.id}
                        style={{ ...s.shiftRow, borderLeft: `3px solid ${sh.color}`, cursor: isAdmin ? 'pointer' : 'default' }}
                        onClick={() => isAdmin && setModal({ date: day, shiftId: sh.id })}>
                        <div style={s.shiftTop}>
                          <span style={{ ...s.shiftLabel, color: sh.color }}>{sh.label}</span>
                          <span style={s.shiftTime}>{isAdmin ? '✏️' : sh.time}</span>
                        </div>
                        <div style={s.assignedList}>
                          {assigned.length === 0
                            ? <span style={s.empty}>Chưa phân công</span>
                            : assigned.map(id => { const n = getUserName(id); return n ? <span key={id} style={s.badge}>{n}</span> : null })
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {modal && isAdmin && (
          <div style={s.overlay} onClick={() => { setModal(null); setUserSearch('') }}>
            <div style={s.modalBox} onClick={e => e.stopPropagation()}>
              <h3 style={s.modalTitle}>{shifts.find(sh => sh.id === modal.shiftId)?.label}</h3>
              <p style={s.modalSub}>{DAY_NAMES[modal.date.getDay()]}, ngày {modal.date.getDate()}/{modal.date.getMonth()+1}/{modal.date.getFullYear()}</p>

              {/* Thanh tìm kiếm */}
              <div style={s.searchWrap}>
                <span style={s.searchIcon}>🔍</span>
                <input
                  style={s.searchInput}
                  placeholder="Tìm nhân viên..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  autoFocus
                />
                {userSearch && (
                  <button style={s.clearBtn} onClick={() => setUserSearch('')}>✕</button>
                )}
              </div>

              {/* Đã chọn */}
              {getAssigned(modal.date, modal.shiftId).length > 0 && (
                <div style={s.selectedWrap}>
                  <span style={s.selectedLabel}>Đã phân công ({getAssigned(modal.date, modal.shiftId).length}):</span>
                  <div style={s.selectedTags}>
                    {getAssigned(modal.date, modal.shiftId).map(id => {
                      const n = getUserName(id)
                      return n ? (
                        <span key={id} style={s.selectedTag}>
                          {n}
                          <button style={s.removeTag} onClick={() => toggleUser(id)}>✕</button>
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Danh sách có scroll */}
              <div style={s.userList}>
                {users
                  .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.username.toLowerCase().includes(userSearch.toLowerCase()))
                  .map(u => {
                    const checked = getAssigned(modal.date, modal.shiftId).includes(u.id)
                    return (
                      <label key={u.id} style={{ ...s.userRow, ...(checked ? s.userRowChecked : {}) }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleUser(u.id)} style={{ marginRight: 10, accentColor: '#667eea' }} />
                        <div style={s.userRowInfo}>
                          <span style={s.userRowName}>{u.name}</span>
                          <span style={s.userRowSub}>{u.username}</span>
                        </div>
                        {checked && <span style={s.checkBadge}>✓</span>}
                      </label>
                    )
                  })
                }
                {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.username.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                  <div style={s.noResult}>Không tìm thấy nhân viên</div>
                )}
              </div>

              <button style={s.closeBtn} onClick={() => { setModal(null); setUserSearch('') }}>Đóng</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const s = {
  wrap: { padding: 16 },
  monthNav: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  navBtn: { background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 22, fontWeight: 700, lineHeight: 1, flexShrink: 0 },
  monthTitle: { fontSize: 20, fontWeight: 700, color: '#2d3748', minWidth: 140, textAlign: 'center' },
  legend: { display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, color: '#4a5568' },
  legendDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  hintText: { fontSize: 11, color: '#a0aec0', marginLeft: 'auto' },
  loadingWrap: { textAlign: 'center', padding: 60, color: '#a0aec0', fontSize: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 },
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
  shiftRow: { padding: '6px 8px', marginBottom: 5, borderRadius: 6, background: '#f7fafc' },
  shiftTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  shiftLabel: { fontSize: 11, fontWeight: 700 },
  shiftTime: { fontSize: 10, color: '#a0aec0' },
  assignedList: { display: 'flex', flexWrap: 'wrap', gap: 3 },
  badge: { background: '#ebf4ff', color: '#3182ce', fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 500 },
  empty: { color: '#cbd5e0', fontSize: 10, fontStyle: 'italic' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 14, padding: '24px 24px 20px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#2d3748', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#718096', marginBottom: 14 },
  searchWrap: { display: 'flex', alignItems: 'center', background: '#f7fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '0 10px', marginBottom: 12 },
  searchIcon: { fontSize: 14, marginRight: 6, opacity: 0.5 },
  searchInput: { flex: 1, border: 'none', background: 'transparent', padding: '9px 0', fontSize: 14, color: '#2d3748' },
  clearBtn: { background: 'none', border: 'none', color: '#a0aec0', fontSize: 14, padding: '0 2px' },
  selectedWrap: { marginBottom: 10 },
  selectedLabel: { fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 6 },
  selectedTags: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  selectedTag: { display: 'flex', alignItems: 'center', gap: 4, background: '#ebf4ff', color: '#3182ce', fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 10 },
  removeTag: { background: 'none', border: 'none', color: '#3182ce', fontSize: 12, padding: 0, lineHeight: 1, opacity: 0.7 },
  userList: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, flex: 1, marginBottom: 14, maxHeight: 320 },
  userRow: { display: 'flex', alignItems: 'center', padding: '9px 12px', background: '#f7fafc', borderRadius: 8, cursor: 'pointer', fontSize: 14, border: '1.5px solid transparent' },
  userRowChecked: { background: '#f0fff4', border: '1.5px solid #9ae6b4' },
  userRowInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 1 },
  userRowName: { fontWeight: 500, color: '#2d3748', fontSize: 14 },
  userRowSub: { fontSize: 11, color: '#a0aec0' },
  checkBadge: { background: '#c6f6d5', color: '#276749', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 },
  noResult: { textAlign: 'center', color: '#a0aec0', padding: '20px 0', fontSize: 13 },
  closeBtn: { width: '100%', padding: 11, background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, flexShrink: 0 },
}
