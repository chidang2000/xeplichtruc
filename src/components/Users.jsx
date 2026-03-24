import { useState } from 'react'
import { getUsers, saveUsers, getSchedule, saveSchedule } from '../store'

const EMPTY_FORM = { name: '', username: '', password: '' }

export default function Users() {
  const [users, setUsers] = useState(getUsers())
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.username) { setError('Vui lòng điền đầy đủ'); return }
    if (!editId && !form.password) { setError('Vui lòng nhập mật khẩu'); return }
    if (users.find(u => u.username === form.username && u.id !== editId)) {
      setError('Tên đăng nhập đã tồn tại'); return
    }

    let updated
    if (editId) {
      updated = users.map(u => u.id === editId ? {
        ...u,
        name: form.name,
        username: form.username,
        ...(form.password ? { password: form.password } : {}),
      } : u)
    } else {
      updated = [...users, { id: Date.now(), ...form, role: 'user' }]
    }

    saveUsers(updated); setUsers(updated)
    setForm(EMPTY_FORM); setError(''); setShowForm(false); setEditId(null)
  }

  function handleEdit(u) {
    setForm({ name: u.name, username: u.username, password: '' })
    setEditId(u.id); setShowForm(true); setError('')
  }

  function handleDelete(id) {
    const updated = users.filter(u => u.id !== id)
    saveUsers(updated)
    setUsers(updated)

    // Dọn user khỏi schedule
    const schedule = getSchedule()
    const cleaned = {}
    for (const [date, shifts] of Object.entries(schedule)) {
      cleaned[date] = {}
      for (const [shiftId, assignedIds] of Object.entries(shifts)) {
        const filtered = assignedIds.filter(uid => uid !== id)
        cleaned[date][shiftId] = filtered
      }
    }
    saveSchedule(cleaned)
    setDeleteId(null)
  }

  function cancelForm() {
    setForm(EMPTY_FORM); setError(''); setShowForm(false); setEditId(null)
  }

  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <h2 style={s.title}>Quản lý Nhân Viên</h2>
        <button style={s.addBtn} onClick={() => { if (showForm && !editId) { cancelForm() } else { cancelForm(); setShowForm(true) } }}>
          {showForm && !editId ? '✕ Đóng' : '+ Thêm nhân viên'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={s.form}>
          <h3 style={s.formTitle}>{editId ? '✏️ Chỉnh sửa nhân viên' : '➕ Thêm nhân viên mới'}</h3>
          <div style={s.formRow}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Họ tên</label>
              <input style={s.input} placeholder="Nguyễn Văn A" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Tên đăng nhập</label>
              <input style={s.input} placeholder="nguyenvana" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>{editId ? 'Mật khẩu mới (để trống = giữ nguyên)' : 'Mật khẩu'}</label>
              <input style={s.input} type="password" placeholder={editId ? 'Để trống nếu không đổi' : 'Tối thiểu 6 ký tự'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          {error && <p style={s.error}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={s.submitBtn} type="submit">{editId ? 'Lưu thay đổi' : 'Thêm nhân viên'}</button>
            <button style={s.cancelBtn} type="button" onClick={cancelForm}>Hủy</button>
          </div>
        </form>
      )}

      <div style={s.table}>
        <div style={s.tableHead}>
          <span style={{ flex: 2 }}>Họ tên</span>
          <span style={{ flex: 1.5 }}>Tên đăng nhập</span>
          <span style={{ flex: 1 }}>Vai trò</span>
          <span style={{ flex: 1.5 }}>Thao tác</span>
        </div>
        {users.map(u => (
          <div key={u.id} style={s.tableRow}>
            <span style={{ flex: 2, fontWeight: 500 }}>{u.name}</span>
            <span style={{ flex: 1.5, color: '#718096' }}>{u.username}</span>
            <span style={{ flex: 1 }}>
              <span style={{ ...s.roleBadge, ...(u.role === 'admin' ? s.adminBadge : s.userBadge) }}>
                {u.role === 'admin' ? '🔑 Admin' : '👤 Nhân viên'}
              </span>
            </span>
            <span style={{ flex: 1.5, display: 'flex', gap: 8 }}>
              <button style={s.editBtn} onClick={() => handleEdit(u)}>✏️ Sửa</button>
              {u.role !== 'admin' && (
                <button style={s.deleteBtn} onClick={() => setDeleteId(u.id)}>🗑️ Xóa</button>
              )}
            </span>
          </div>
        ))}
      </div>

      {deleteId && (
        <div style={s.overlay} onClick={() => setDeleteId(null)}>
          <div style={s.confirmBox} onClick={e => e.stopPropagation()}>
            <p style={{ marginBottom: 8, fontSize: 16, fontWeight: 600 }}>Xác nhận xóa nhân viên?</p>
            <p style={{ marginBottom: 20, fontSize: 13, color: '#718096' }}>
              <strong>{users.find(u => u.id === deleteId)?.name}</strong> sẽ bị xóa khỏi tất cả ca trực đã phân công.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={s.cancelBtnModal} onClick={() => setDeleteId(null)}>Hủy</button>
              <button style={s.confirmBtn} onClick={() => handleDelete(deleteId)}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { padding: 24 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700, color: '#2d3748' },
  addBtn: { background: '#667eea', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 },
  form: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  formTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#2d3748' },
  formRow: { display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 160 },
  label: { fontSize: 12, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.4px' },
  input: { padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  error: { color: '#e53e3e', fontSize: 13, marginBottom: 10 },
  submitBtn: { background: '#667eea', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14 },
  cancelBtn: { background: '#edf2f7', color: '#4a5568', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 },
  table: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  tableHead: { display: 'flex', padding: '12px 20px', background: '#f7fafc', fontWeight: 600, fontSize: 13, color: '#718096', borderBottom: '1px solid #e2e8f0' },
  tableRow: { display: 'flex', padding: '14px 20px', borderBottom: '1px solid #f0f4f8', alignItems: 'center', fontSize: 14, flexWrap: 'wrap', gap: 8 },
  roleBadge: { padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500 },
  adminBadge: { background: '#fef3c7', color: '#92400e' },
  userBadge: { background: '#ebf4ff', color: '#2b6cb0' },
  editBtn: { background: '#ebf4ff', color: '#3182ce', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500 },
  deleteBtn: { background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  confirmBox: { background: '#fff', borderRadius: 12, padding: 28, width: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  cancelBtnModal: { flex: 1, padding: 10, background: '#edf2f7', border: 'none', borderRadius: 8, fontWeight: 600 },
  confirmBtn: { flex: 1, padding: 10, background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600 },
}
