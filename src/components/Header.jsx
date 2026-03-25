import { useState, useEffect } from 'react'
import { logoutUser, api } from '../api'

function useUnread(user) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    async function calc() {
      try {
        if (user.role === 'admin') {
          const users = await api.getUsers()
          let total = 0
          for (const u of users.filter(x => x.role === 'user')) {
            const msgs = await api.getMessages(u.id)
            const lastSeen = sessionStorage.getItem(`lastSeen_admin_${u.id}`) || ''
            total += msgs.filter(m => m.fromId === u.id && m.id > lastSeen).length
          }
          setCount(total)
        } else {
          const msgs = await api.getMessages(String(user.id))
          const lastSeen = sessionStorage.getItem(`lastSeen_user_${user.id}`) || ''
          setCount(msgs.filter(m => m.fromId === 'admin' && m.id > lastSeen).length)
        }
      } catch {}
    }
    calc()
    const t = setInterval(calc, 5000)
    return () => clearInterval(t)
  }, [user])
  return count
}

export default function Header({ user, tab, setTab, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const unread = useUnread(user)

  const tabs = user.role === 'admin'
    ? [{ id: 'schedule', label: '📅 Lịch Trực' }, { id: 'shifts', label: '⚙️ Ca Trực' }, { id: 'users', label: '👥 Nhân Viên' }, { id: 'messages', label: '💬 Tin Nhắn' }]
    : [{ id: 'schedule', label: '📅 Lịch Trực' }, { id: 'messages', label: '💬 Nhắn Tin' }]

  function handleTab(id) { setTab(id); setMenuOpen(false) }

  return (
    <div style={s.stickyWrap}>
      <header style={s.header}>
        <div style={s.left}>
          <span style={s.logo}>📅</span>
          <span style={s.brand}>Xếp Lịch Trực</span>
        </div>

        <nav className="desktop-nav" style={s.nav}>
          {tabs.map(t => (
            <button key={t.id} style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }} onClick={() => handleTab(t.id)}>
              {t.label}
              {t.id === 'messages' && unread > 0 && <span style={s.badge}>{unread > 99 ? '99+' : unread}</span>}
            </button>
          ))}
        </nav>

        <div style={s.right}>
          <span className="desktop-user" style={s.userInfo}>{user.role === 'admin' ? '🔑' : '👤'} {user.name}</span>
          <button className="desktop-logout" style={s.logoutBtn} onClick={() => { logoutUser(); onLogout() }}>Đăng xuất</button>
          <button className="hamburger-btn" style={{ ...s.hamburger, display: 'flex' }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
            {!menuOpen && unread > 0 && <span style={s.hamburgerDot} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu" style={s.mobileMenu}>
          <div style={s.mobileUser}>{user.role === 'admin' ? '🔑' : '👤'} {user.name}</div>
          {tabs.map(t => (
            <button key={t.id} style={{ ...s.mobileTab, ...(tab === t.id ? s.mobileTabActive : {}) }} onClick={() => handleTab(t.id)}>
              <span style={{ flex: 1, textAlign: 'left' }}>{t.label}</span>
              {t.id === 'messages' && unread > 0 && <span style={s.badge}>{unread > 99 ? '99+' : unread}</span>}
            </button>
          ))}
          <button style={s.mobileLogout} onClick={() => { logoutUser(); onLogout() }}>🚪 Đăng xuất</button>
        </div>
      )}
    </div>
  )
}

const s = {
  stickyWrap: { position: 'sticky', top: 0, zIndex: 50 },
  header: { background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 56, boxShadow: '0 2px 10px rgba(0,0,0,0.15)' },
  left: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  logo: { fontSize: 20 },
  brand: { fontWeight: 700, fontSize: 16 },
  nav: { display: 'flex', gap: 4 },
  tab: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 },
  tabActive: { background: 'rgba(255,255,255,0.35)', fontWeight: 700 },
  right: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  userInfo: { fontSize: 13, opacity: 0.9, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: { background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, whiteSpace: 'nowrap' },
  hamburger: { position: 'relative', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: 8, fontSize: 18, alignItems: 'center', justifyContent: 'center' },
  hamburgerDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#e53e3e', border: '1.5px solid #764ba2' },
  mobileMenu: { background: 'linear-gradient(135deg,#5a6fd6,#6a3fa0)', display: 'flex', flexDirection: 'column', padding: '8px 12px 12px', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.25)' },
  mobileUser: { color: 'rgba(255,255,255,0.75)', fontSize: 13, padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.2)', marginBottom: 4 },
  mobileTab: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '11px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 },
  mobileTabActive: { background: 'rgba(255,255,255,0.35)', fontWeight: 700 },
  mobileLogout: { background: 'rgba(255,0,0,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '11px 14px', borderRadius: 8, fontSize: 14, textAlign: 'left', marginTop: 4 },
  badge: { background: '#e53e3e', color: '#fff', fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center', lineHeight: '16px' },
}
