import { useState } from 'react'
import { api, setCurrentUser } from '../api'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', password: '', name: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const user = await api.login(form.username, form.password)
      setCurrentUser(user)
      onLogin(user)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!form.name || !form.username || !form.password || !form.confirmPassword) { setError('Vui lòng điền đầy đủ'); return }
    if (form.password !== form.confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return }
    if (form.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return }
    setLoading(true); setError('')
    try {
      await api.register(form.name, form.username, form.password)
      setSuccess('Đăng ký thành công! Hãy đăng nhập.')
      setForm({ username: '', password: '', name: '', confirmPassword: '' })
      setTimeout(() => { setMode('login'); setSuccess('') }, 1500)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  function switchMode(m) { setMode(m); setError(''); setSuccess(''); setForm({ username: '', password: '', name: '', confirmPassword: '' }) }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>📅</div>
        <h2 style={s.title}>Xếp Lịch Trực</h2>
        <div style={s.tabs}>
          <button style={{ ...s.tabBtn, ...(mode === 'login' ? s.tabActive : {}) }} onClick={() => switchMode('login')}>Đăng nhập</button>
          <button style={{ ...s.tabBtn, ...(mode === 'register' ? s.tabActive : {}) }} onClick={() => switchMode('register')}>Đăng ký</button>
        </div>
        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <input style={s.input} placeholder="Tên đăng nhập" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            <input style={s.input} type="password" placeholder="Mật khẩu" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            {error && <p style={s.error}>{error}</p>}
            <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <input style={s.input} placeholder="Họ và tên" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input style={s.input} placeholder="Tên đăng nhập" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            <input style={s.input} type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <input style={s.input} type="password" placeholder="Xác nhận mật khẩu" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
            {error && <p style={s.error}>{error}</p>}
            {success && <p style={s.success}>{success}</p>}
            <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
          </form>
        )}
        <p style={s.hint}>Admin: admin / admin123</p>
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
  tabBtn: { flex: 1, padding: '9px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, background: 'transparent', color: '#718096', cursor: 'pointer' },
  tabActive: { background: '#fff', color: '#667eea', fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  input: { display: 'block', width: '100%', padding: '12px 14px', marginBottom: 12, border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  error: { color: '#e53e3e', fontSize: 13, marginBottom: 10 },
  success: { color: '#38a169', fontSize: 13, marginBottom: 10, background: '#f0fff4', padding: '8px 12px', borderRadius: 6 },
  btn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, marginTop: 4, opacity: 1 },
  hint: { marginTop: 16, fontSize: 11, color: '#a0aec0' },
}
