import { useState } from 'react'
import { getCurrentUser } from './api'
import Login from './components/Login'
import Header from './components/Header'
import Schedule from './components/Schedule'
import Users from './components/Users'
import Messages from './components/Messages'
import ShiftManager from './components/ShiftManager'

export default function App() {
  const [user, setUser] = useState(getCurrentUser())
  const [tab, setTab] = useState('schedule')

  if (!user) return <Login onLogin={u => { setUser(u); setTab('schedule') }} />

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <Header user={user} tab={tab} setTab={setTab} onLogout={() => setUser(null)} />
      <main>
        {tab === 'schedule' && <Schedule user={user} />}
        {tab === 'shifts' && user.role === 'admin' && <ShiftManager />}
        {tab === 'users' && user.role === 'admin' && <Users />}
        {tab === 'messages' && <Messages user={user} />}
      </main>
    </div>
  )
}
