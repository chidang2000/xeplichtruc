import { useState, useEffect } from 'react'
import { api } from '../api'

const COLORS = ['#48bb78','#fbbf24','#60a5fa','#818cf8','#f87171','#fb923c','#34d399','#e879f9']
const today = new Date()
const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
const DAY_SHORT = ['CN','T2','T3','T4','T5','T6','T7']

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getDays(year, month) {
  const days = []; const d = new Date(year, month, 1)
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate()+1) }
  return days
}

export default function ShiftManager() {
  const [shifts, setShifts] = useState([])
  const [dayShifts, setDayShifts] = useState({})
  const [form, setForm] = useState({ label: '', time: '', color: COLORS[0] })
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [activeTab, setActiveTab] = useState('global')

  const days = getDays(year, month)

  useEffect(() => { api.getShifts().then(setShifts) }, [])
  useEffect(() => { api.getDayShifts(year, month+1).then(setDayShifts) }, [year, month])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.label) { setError('Vui lòng nhập tên ca'); return }
    try {
      if (editId) {
        const updated = await api.updateShift(editId, form)
        setShifts(prev => prev.map(s => s.id === editId ? updated : s))
      } else {
        const newShift = await api.addShift(form)
        setShifts(prev => [...prev, newShift])
      }
      setForm({ label: '', time: '', color: COLORS[0] }); setEditId(null); setError(''); setShowForm(false)
    } catch (err) { setError(err.message) }
  }

  function handleEdit(sh) { setForm({ label: sh.label, time: sh.time || '', color: sh.color }); setEditId(sh.id); setShowForm(true) }

  async function handleDelete(id) {
    await api.deleteShift(id)
    setShifts(prev => prev.filter(s => s.id !== id))
  }

  function cancelForm() { setForm({ label: '', time: '', color: COLORS[0] }); setEditId(null); setError(''); setShowForm(false) }

  function getActiveShifts(date) {
    const key = dateKey(date)
    if (dayShifts[key] === undefined || dayShifts[key] === null) return shifts.map(s => s.id)
    return dayShifts[key]
  }

  async function toggleDayShift(date, shiftId) {
    const key = dateKey(date)
    const cur = getActiveShifts(date)
    const updated = cur.includes(shiftId) ? cur.filter(id => id !== shiftId) : [...cur, shiftId]
    await api.updateDayShifts(key, updated)
    setDayShifts(prev => ({ ...prev, [key]: updated }))
  }

  function prevMonth() { month === 0 ? (setYear(y => y-1), setMonth(11)) : setMonth(m => m-1) }
  function nextMonth() { month === 11 ? (setYear(y => y+1), setMonth(0)) : setMonth(m => m+1) }

  return (
    <div style={s.wrap}>
      <h2 style={s.pageTitle}>⚙️ Quản lý Ca Trực</h2>
      <div style={s.tabs}>
        <button style={{ ...s.tabBtn, ...(activeTab === 'global' ? s.tabActive : {}) }} onClick={() => setActiveTab('global')}>📋 Danh sách ca</button>
        <button style={{ ...s.tabBtn, ...(activeTab === 'daily' ? s.tabActive : {}) }} onClick={() => setActiveTab('daily')}>📅 Cấu hình theo ngày</button>
      </div>

      {activeTab === 'global' && (
        <div>
          <div style={s.topBar}>
            <p style={s.desc}>Quản lý các ca trực áp dụng cho toàn bộ lịch</p>
            <button style={s.addBtn} onClick={() => { cancelForm(); setShowForm(!showForm) }}>
              {showForm && !editId ? '✕ Đóng' : '+ Thêm ca mới'}
            </button>
          </div>
          {showForm && (
            <form onSubmit={handleSave} style={s.form}>
              <h3 style={s.formTitle}>{editId ? '✏️ Chỉnh sửa ca' : '➕ Thêm ca mới'}</h3>
              <div style={s.formRow}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Tên ca</label>
                  <input style={s.input} placeholder="VD: Ca Sáng" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Thời gian (tuỳ chọn)</label>
                  <input style={s.input} placeholder="VD: 06:00 - 14:00" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Màu sắc</label>
                  <div style={s.colorRow}>
                    {COLORS.map(c => (
                      <button key={c} type="button" style={{ ...s.colorDot, background: c, ...(form.color === c ? s.colorDotActive : {}) }} onClick={() => setForm({ ...form, color: c })} />
                    ))}
                  </div>
                </div>
              </div>
              {error && <p style={s.error}>{error}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={s.saveBtn} type="submit">{editId ? 'Lưu thay đổi' : 'Thêm ca'}</button>
                <button style={s.cancelBtn} type="button" onClick={cancelForm}>Hủy</button>
              </div>
            </form>
          )}
          <div style={s.shiftList}>
            {shifts.map(sh => (
              <div key={sh.id} style={s.shiftCard}>
                <div style={{ ...s.shiftColor, background: sh.color }} />
                <div style={s.shiftInfo}>
                  <span style={s.shiftName}>{sh.label}</span>
                  {sh.time && <span style={s.shiftTime}>🕐 {sh.time}</span>}
                </div>
                <div style={s.shiftActions}>
                  <button style={s.editBtn} onClick={() => handleEdit(sh)}>✏️ Sửa</button>
                  <button style={s.deleteBtn} onClick={() => handleDelete(sh.id)}>🗑️ Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'daily' && (
        <div>
          <div style={s.monthNav}>
            <button style={s.navBtn} onClick={prevMonth}>‹</button>
            <span style={s.monthTitle}>{MONTHS[month]} {year}</span>
            <button style={s.navBtn} onClick={nextMonth}>›</button>
          </div>
          <p style={s.desc}>Bật/tắt từng ca cho từng ngày. Mặc định tất cả ca đều bật.</p>
          <div style={s.dayGrid}>
            {days.map(day => {
              const active = getActiveShifts(day)
              const isToday = dateKey(day) === dateKey(today)
              return (
                <div key={dateKey(day)} style={{ ...s.dayCard, ...(isToday ? s.todayCard : {}) }}>
                  <div style={s.dayHeader}>
                    <span style={s.dayName}>{DAY_SHORT[day.getDay()]}</span>
                    <span style={{ ...s.dayNum, ...(isToday ? s.todayNum : {}) }}>{day.getDate()}</span>
                  </div>
                  <div style={s.shiftToggles}>
                    {shifts.map(sh => {
                      const on = active.includes(sh.id)
                      return (
                        <button key={sh.id}
                          style={{ ...s.toggleBtn, background: on ? sh.color+'33' : '#f0f4f8', borderColor: on ? sh.color : '#e2e8f0', color: on ? sh.color : '#a0aec0' }}
                          onClick={() => toggleDayShift(day, sh.id)}>
                          {on ? '✓' : '✕'} {sh.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { padding: 24 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: '#2d3748', marginBottom: 20 },
  tabs: { display: 'flex', background: '#e2e8f0', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content' },
  tabBtn: { padding: '9px 20px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, background: 'transparent', color: '#718096', cursor: 'pointer' },
  tabActive: { background: '#fff', color: '#667eea', fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  desc: { color: '#718096', fontSize: 14 },
  addBtn: { background: '#667eea', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 },
  form: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  formTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#2d3748' },
  formRow: { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 160 },
  label: { fontSize: 12, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  colorRow: { display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 },
  colorDot: { width: 28, height: 28, borderRadius: '50%', border: '3px solid transparent', cursor: 'pointer' },
  colorDotActive: { border: '3px solid #2d3748', transform: 'scale(1.15)' },
  error: { color: '#e53e3e', fontSize: 13, marginBottom: 10 },
  saveBtn: { background: '#667eea', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14 },
  cancelBtn: { background: '#edf2f7', color: '#4a5568', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 },
  shiftList: { display: 'flex', flexDirection: 'column', gap: 10 },
  shiftCard: { background: '#fff', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' },
  shiftColor: { width: 14, height: 40, borderRadius: 6, flexShrink: 0 },
  shiftInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
  shiftName: { fontWeight: 600, fontSize: 15, color: '#2d3748' },
  shiftTime: { fontSize: 13, color: '#718096' },
  shiftActions: { display: 'flex', gap: 8 },
  editBtn: { background: '#ebf4ff', color: '#3182ce', border: 'none', padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500 },
  deleteBtn: { background: '#fff5f5', color: '#e53e3e', border: 'none', padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500 },
  monthNav: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 },
  navBtn: { background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, width: 34, height: 34, fontSize: 20, fontWeight: 700 },
  monthTitle: { fontSize: 18, fontWeight: 700, color: '#2d3748' },
  dayGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginTop: 16 },
  dayCard: { background: '#fff', borderRadius: 10, padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '2px solid transparent' },
  todayCard: { border: '2px solid #667eea' },
  dayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #f0f4f8' },
  dayName: { fontSize: 11, fontWeight: 700, color: '#a0aec0' },
  dayNum: { width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 700, fontSize: 14, color: '#2d3748' },
  todayNum: { background: '#667eea', color: '#fff' },
  shiftToggles: { display: 'flex', flexDirection: 'column', gap: 5 },
  toggleBtn: { padding: '5px 8px', borderRadius: 6, border: '1.5px solid', fontSize: 11, fontWeight: 600, textAlign: 'left', cursor: 'pointer' },
}
