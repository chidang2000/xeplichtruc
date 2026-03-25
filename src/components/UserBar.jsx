import { useState } from 'react'

const DAY_NAMES = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7']
const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function UserBar({ user, year, month, days, schedule, dayShifts, shifts }) {
  const [open, setOpen] = useState(false)
  const today = new Date()

  function getActiveShifts(date) {
    const key = dateKey(date)
    if (!dayShifts[key]) return shifts
    return shifts.filter(s => dayShifts[key].includes(s.id))
  }

  function getMySchedule() {
    const result = []
    for (const day of days) {
      const key = dateKey(day)
      const activeShifts = getActiveShifts(day)
      for (const sh of activeShifts) {
        const assigned = schedule[key]?.[sh.id] || []
        if (assigned.includes(String(user.id)) || assigned.includes(user.id)) {
          result.push({ day, shift: sh })
        }
      }
    }
    return result
  }

  const myList = open ? getMySchedule() : []
  const totalThisMonth = getMySchedule().length

  // Ca trực hôm nay
  const todayShifts = (() => {
    const key = dateKey(today)
    const active = getActiveShifts(today)
    return active.filter(sh => {
      const assigned = schedule[key]?.[sh.id] || []
      return assigned.includes(String(user.id)) || assigned.includes(user.id)
    })
  })()

  return (
    <>
      <div className="user-sticky-bar">
        <div style={s.barLeft}>
          {todayShifts.length > 0 ? (
            <span style={s.todayInfo}>
              🕐 Hôm nay: {todayShifts.map(sh => (
                <span key={sh.id} style={{ ...s.shiftTag, background: sh.color + '33', color: sh.color, border: `1px solid ${sh.color}66` }}>
                  {sh.label}{sh.time ? ` (${sh.time})` : ''}
                </span>
              ))}
            </span>
          ) : (
            <span style={s.noShift}>📅 Hôm nay không có ca trực</span>
          )}
        </div>
        <button style={s.myBtn} onClick={() => setOpen(true)}>
          📋 Lịch của tôi
          {totalThisMonth > 0 && <span style={s.countBadge}>{totalThisMonth}</span>}
        </button>
      </div>

      {open && (
        <div style={s.overlay} onClick={() => setOpen(false)}>
          <div className="my-schedule-modal" style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>📋 Lịch trực của tôi</h3>
            <p style={s.modalSub}>{MONTHS[month]} {year} — {user.name}</p>

            {myList.length === 0 ? (
              <div style={s.empty}>Bạn chưa có ca trực nào trong tháng này</div>
            ) : (
              <div style={s.list}>
                {myList.map(({ day, shift }, i) => {
                  const isToday = dateKey(day) === dateKey(today)
                  return (
                    <div key={i} style={{ ...s.item, ...(isToday ? s.itemToday : {}) }}>
                      <div style={{ ...s.dot, background: shift.color }} />
                      <div style={s.info}>
                        <div style={s.dateRow}>
                          <span style={s.dateTxt}>
                            {DAY_NAMES[day.getDay()]}, {String(day.getDate()).padStart(2,'0')}/{String(day.getMonth()+1).padStart(2,'0')}/{day.getFullYear()}
                          </span>
                          {isToday && <span style={s.todayTag}>Hôm nay</span>}
                        </div>
                        <span style={{ ...s.shiftTxt, color: shift.color }}>
                          {shift.label}{shift.time ? ` · ${shift.time}` : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={s.summary}>Tổng: {myList.length} ca trong tháng</div>
            <button style={s.closeBtn} onClick={() => setOpen(false)}>Đóng</button>
          </div>
        </div>
      )}
    </>
  )
}

const s = {
  barLeft: { flex: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  todayInfo: { color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  shiftTag: { padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600 },
  noShift: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  myBtn: { background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '7px 14px', borderRadius: 8, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 },
  countBadge: { background: '#e53e3e', color: '#fff', fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: '#fff', borderRadius: 14, padding: '24px 24px 20px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#2d3748', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#718096', marginBottom: 16 },
  list: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, marginBottom: 12 },
  item: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f7fafc', borderRadius: 8, border: '1.5px solid transparent' },
  itemToday: { background: '#ebf4ff', border: '1.5px solid #bee3f8' },
  dot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  info: { display: 'flex', flexDirection: 'column', gap: 2 },
  dateRow: { display: 'flex', alignItems: 'center', gap: 8 },
  dateTxt: { fontSize: 13, fontWeight: 600, color: '#2d3748' },
  todayTag: { background: '#667eea', color: '#fff', fontSize: 10, padding: '1px 7px', borderRadius: 10, fontWeight: 600 },
  shiftTxt: { fontSize: 12, fontWeight: 500 },
  empty: { textAlign: 'center', color: '#a0aec0', padding: '24px 0', fontSize: 14 },
  summary: { fontSize: 12, color: '#718096', textAlign: 'right', marginBottom: 12, flexShrink: 0 },
  closeBtn: { width: '100%', padding: 11, background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, flexShrink: 0 },
}
