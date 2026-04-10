import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

function ChatBox({ thread, text, setText, onSend, isAdmin, users, inputRef }) {
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread.length])
  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }
  function fmt(iso) {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
  return (
    <>
      <div style={s.messages}>
        {thread.length === 0 && <div style={s.placeholder}>Chưa có tin nhắn nào</div>}
        {thread.map(m => {
          const mine = isAdmin ? m.fromId === 'admin' : m.toId === 'admin'
          return (
            <div key={m.id} style={{ ...s.msgRow, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{ ...s.bubble, ...(mine ? s.bubbleMine : s.bubbleOther) }}>
                {!mine && <div style={s.senderName}>{isAdmin ? users.find(u => u.id === m.fromId)?.name : 'Admin'}</div>}
                <div style={s.msgText}>{m.text}</div>
                <div style={s.msgTime}>{fmt(m.time)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div style={s.inputRow}>
        <textarea ref={inputRef} style={s.textarea} placeholder="Nhập tin nhắn... (Enter để gửi)" value={text}
          onChange={e => setText(e.target.value)} onKeyDown={handleKey} rows={2} />
        <button style={s.sendBtn} onClick={onSend}>Gửi</button>
      </div>
    </>
  )
}

export default function Messages({ user }) {
  const isAdmin = user.role === 'admin'
  const [users, setUsers] = useState([])
  const [conversationIds, setConversationIds] = useState(null) // null = chưa load
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [unread, setUnread] = useState({})
  const inputRef = useRef(null)

  useEffect(() => {
    if (isAdmin) {
      Promise.all([api.getUsers(), api.getConversations()]).then(([u, ids]) => {
        setUsers(u.filter(x => x.role === 'user'))
        setConversationIds(ids)
      })
    }
  }, [])

  // Load + polling thread đang mở
  useEffect(() => {
    const uid = isAdmin ? selectedUserId : String(user.id)
    if (!uid) return
    let active = true

    async function load() {
      const msgs = await api.getMessages(uid)
      if (!active) return
      setMessages(msgs)
      // Đánh dấu đã đọc trên server
      const readerId = isAdmin ? 'admin' : String(user.id)
      await api.markRead(uid, readerId)
      // Cập nhật unread count
      if (isAdmin) {
        setUnread(prev => ({ ...prev, [uid]: 0 }))
      } else {
        setUnread(0)
      }
    }

    load()
    const t = setInterval(load, 2000)
    return () => { active = false; clearInterval(t) }
  }, [selectedUserId])

  // Admin: polling unread tất cả user — chỉ update những user không đang xem
  useEffect(() => {
    if (!isAdmin) return
    let active = true
    async function checkUnread() {
      try {
        const counts = await api.getUnreadAdmin()
        if (active) {
          setUnread(prev => {
            const next = { ...counts }
            // Giữ nguyên 0 cho user đang xem
            if (selectedUserId) next[selectedUserId] = 0
            return next
          })
        }
      } catch {}
    }
    checkUnread()
    const t = setInterval(checkUnread, 3000)
    return () => { active = false; clearInterval(t) }
  }, [isAdmin, selectedUserId])

  // User: polling unread
  useEffect(() => {
    if (isAdmin) return
    let active = true
    async function checkUnread() {
      try {
        const { count } = await api.getUnreadUser(String(user.id))
        if (active) setUnread(count)
      } catch {}
    }
    checkUnread()
    const t = setInterval(checkUnread, 3000)
    return () => { active = false; clearInterval(t) }
  }, [isAdmin])

  async function send() {
    if (!text.trim()) return
    if (isAdmin && !selectedUserId) return
    const msg = await api.sendMessage({
      fromId: isAdmin ? 'admin' : String(user.id),
      fromName: user.name,
      toId: isAdmin ? selectedUserId : 'admin',
      text: text.trim(),
    })
    setMessages(prev => [...prev, msg])
    setText('')
    // Thêm vào danh sách conversation nếu chưa có
    if (isAdmin && selectedUserId) {
      setConversationIds(prev => prev && !prev.includes(String(selectedUserId)) ? [...prev, String(selectedUserId)] : prev)
    }
  }

  const [sidebarSearch, setSidebarSearch] = useState('')

  function selectUser(uid) {
    setSelectedUserId(uid); setText(''); setMessages([]); setSidebarSearch('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Nếu đang search thì tìm trong tất cả user, không thì chỉ hiện người đã chat
  const baseUsers = sidebarSearch
    ? users
    : users.filter(u => conversationIds?.includes(String(u.id)))

  const filteredUsers = baseUsers
    .filter(u => u.name.toLowerCase().includes(sidebarSearch.toLowerCase()) || u.username.toLowerCase().includes(sidebarSearch.toLowerCase()))
    .sort((a, b) => (unread[b.id] || 0) - (unread[a.id] || 0))

  return (
    <div style={s.wrap} className="messages-wrap">
      {isAdmin ? (
        <div style={s.layout} className="messages-layout">
          <div style={s.sidebar} className="messages-sidebar">
            <div style={s.sidebarTitle}>💬 Hội thoại</div>
            <div style={s.sidebarSearch}>
              <span style={s.searchIcon}>🔍</span>
              <input
                style={s.sidebarSearchInput}
                placeholder="Tìm nhân viên..."
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
              />
              {sidebarSearch && <button style={s.clearBtn} onClick={() => setSidebarSearch('')}>✕</button>}
            </div>
            {!sidebarSearch && conversationIds !== null && baseUsers.length === 0 && (
              <div style={s.noResult}>Chưa có hội thoại nào</div>
            )}
            {filteredUsers.length === 0 && <div style={s.noResult}>Không tìm thấy</div>}
            {filteredUsers.map(u => {
              const cnt = unread[u.id] || 0
              return (
                <div key={u.id}
                  style={{ ...s.userItem, ...(selectedUserId === u.id ? s.userItemActive : {}), ...(cnt > 0 ? s.userItemUnread : {}) }}
                  onClick={() => selectUser(u.id)}
                >
                  <div style={s.avatarWrap}>
                    <div style={s.avatar}>{u.name[0]}</div>
                    {cnt > 0 && <span style={s.dot}>{cnt > 99 ? '99+' : cnt}</span>}
                  </div>
                  <div style={s.userMeta}>
                    <div style={{ ...s.userName, ...(cnt > 0 ? { color: '#2b6cb0', fontWeight: 700 } : {}) }}>{u.name}</div>
                    <div style={s.userSub}>
                      {cnt > 0 ? <span style={s.unreadLabel}>{cnt} tin chưa đọc</span> : u.username}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={s.chatArea}>
            {!selectedUserId
              ? <div style={s.placeholder}>← Chọn nhân viên để xem hội thoại</div>
              : <>
                  <div style={s.chatHeader}>💬 {users.find(u => u.id === selectedUserId)?.name}</div>
                  <ChatBox thread={messages} text={text} setText={setText} onSend={send} isAdmin={isAdmin} users={users} inputRef={inputRef} />
                </>
            }
          </div>
        </div>
      ) : (
        <div style={s.userChat}>
          <div style={s.chatHeader}>💬 Nhắn tin với Admin</div>
          <ChatBox thread={messages} text={text} setText={setText} onSend={send} isAdmin={isAdmin} users={users} inputRef={inputRef} />
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { padding: 24, height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' },
  layout: { display: 'flex', flex: 1, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', minHeight: 0 },
  sidebar: { width: 250, borderRight: '1px solid #e2e8f0', overflowY: 'auto', flexShrink: 0 },
  sidebarTitle: { padding: '16px 16px 12px', fontWeight: 700, fontSize: 15, color: '#2d3748', borderBottom: '1px solid #e2e8f0' },
  sidebarSearch: { display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', gap: 6 },
  searchIcon: { fontSize: 13, opacity: 0.5, flexShrink: 0 },
  sidebarSearchInput: { flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: '#2d3748', outline: 'none', minWidth: 0 },
  clearBtn: { background: 'none', border: 'none', color: '#a0aec0', fontSize: 12, padding: 0, cursor: 'pointer', flexShrink: 0 },
  noResult: { padding: '16px', textAlign: 'center', color: '#a0aec0', fontSize: 13 },
  userItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f4f8' },
  userItemActive: { background: '#ebf4ff' },
  userItemUnread: { background: '#fff5f5' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 },
  dot: { position: 'absolute', top: -3, right: -3, background: '#e53e3e', color: '#fff', fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid #fff' },
  userMeta: { flex: 1, minWidth: 0 },
  userName: { fontWeight: 600, fontSize: 14, color: '#2d3748' },
  userSub: { fontSize: 11, color: '#a0aec0', marginTop: 2 },
  unreadLabel: { color: '#e53e3e', fontWeight: 600 },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  userChat: { flex: 1, background: '#fff', borderRadius: 12, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' },
  chatHeader: { padding: '14px 20px', fontWeight: 700, fontSize: 15, borderBottom: '1px solid #e2e8f0', color: '#2d3748', flexShrink: 0 },
  messages: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 },
  placeholder: { color: '#a0aec0', textAlign: 'center', marginTop: 40, fontSize: 14 },
  msgRow: { display: 'flex' },
  bubble: { maxWidth: '65%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.5 },
  bubbleMine: { background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', borderBottomRightRadius: 4 },
  bubbleOther: { background: '#f0f4f8', color: '#2d3748', borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontWeight: 600, marginBottom: 3, opacity: 0.7 },
  msgText: { wordBreak: 'break-word' },
  msgTime: { fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' },
  inputRow: { display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid #e2e8f0', alignItems: 'flex-end', flexShrink: 0 },
  textarea: { flex: 1, padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, resize: 'none', fontFamily: 'inherit' },
  sendBtn: { background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, height: 44 },
}
