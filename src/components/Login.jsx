import { useState } from 'react'
import { getUsers, saveUsers, setCurrentUser } from '../store'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ username: '', password: '', name: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    const user = getUsers().find(u => u.username === form.username && u.password === form.password)
    if (!user) { setError('Sai tên đăng nhập hoặc mật khẩu'); return }
    setCurrentUser(user)
    onLogin(user)
  }

  function handleRegister(e) {
    e.preventDefault()
    if (!form.name || !form.username || !form.password || !form.confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin'); return
    }
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp'); return
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự'); return
    }
    const users = getUsers()
    if (users.find(u => u.username === form.username)) {
      setError('Tên đăng nhập đã tồn tại'); return
    }
    const newUser = { id: Date.now(), name: form.name, username: form.username, password: form.password, role: 'user' }
    saveUsers([...users, newUser])
    setSuccess('Đăng ký thành công! Hãy đăng nhập.')
    setError('')
    setForm({ username: '', password: '', name: '', confirmPassword: '' })
    setTimeout(() => { setMode('login'); setSuccess('') }, 1500)
  }

  function switchMode(m) { setMode(m); setError(''); setSuccess(''); setForm({ username: '', password: '', name: '', confirmPassword: '' }) }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>📅</div>
        <h2 style={s.title}>Xếp Lịch Trực</h2>

        {/* Tab switch */}
        <div style={s.tabs}>
          <button style={{ ...s.tabBtn, ...(mode === 'login' ? s.tabActive : {}) }} onClick={() => switchMode('login')}>Đăng nhập</button>
          <button style={{ ...s.tabBtn, ...(mode === 'register' ? s.tabActive : {}) }} onClick={() => switchMode('register')}>Đăng ký</button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <input style={s.input} placeholder="Tên đăng nhập" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            <input style={s.input} type="password" placeholder="Mật khẩu" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            {error && <p style={s.error}>{error}</p>}
            <button style={s.btn} type="submit">Đăng nhập</button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <input style={s.input} placeholder="Họ và tên" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input style={s.input} placeholder="Tên đăng nhập" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            <input style={s.input} type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <input style={s.input} type="password" placeholder="Xác nhận mật khẩu" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
            {error && <p style={s.error}>{error}</p>}
            {success && <p style={s.success}>{success}</p>}
            <button style={s.btn} type="submit">Tạo tài khoản</button>
          </form>
        )}

        {/* <p style={s.hint}>Admin: admin / admin123 </p> */}
      </div>
    </div>
  )
}

const s = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#667eea,#764ba2)' },
  card: { background: '#fff', borderRadius: 16, padding: '36px 36px 28px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 700, color: '#1a202c', marginBottom: 20 },
  tabs: { display: 'flex', background: '#f0f4f8', borderRadius: 10, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, padding: '9px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, background: 'transparent', color: '#718096' },
  tabActive: { background: '#fff', color: '#667eea', fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  input: { display: 'block', width: '100%', padding: '12px 14px', marginBottom: 12, border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  error: { color: '#e53e3e', fontSize: 13, marginBottom: 10 },
  success: { color: '#38a169', fontSize: 13, marginBottom: 10, background: '#f0fff4', padding: '8px 12px', borderRadius: 6 },
  btn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, marginTop: 4 },
  hint: { marginTop: 16, fontSize: 11, color: '#a0aec0' },
}
