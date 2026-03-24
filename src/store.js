const DEFAULT_USERS = [
  { id: 1, username: 'admin', password: 'admin123', name: 'Quản trị viên', role: 'admin' },
  
]

const DEFAULT_SHIFTS = [
  { id: 'ca-ngay', label: 'Cả Ngày', time: '06:00 - 22:00', color: '#48bb78' },
  { id: 'ca-sang', label: 'Ca Sáng', time: '06:00 - 14:00', color: '#fbbf24' },
  { id: 'ca-chieu', label: 'Ca Chiều', time: '14:00 - 22:00', color: '#60a5fa' },
  { id: 'ca-dem', label: 'Ca Đêm', time: '22:00 - 06:00', color: '#818cf8' },
]

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)) }

export function getUsers() { return load('users', DEFAULT_USERS) }
export function saveUsers(users) { save('users', users) }
export function getShifts() { return load('shifts', DEFAULT_SHIFTS) }
export function saveShifts(shifts) { save('shifts', shifts) }

// Lưu ca nào được bật/tắt theo từng ngày: { 'YYYY-MM-DD': ['ca-sang', 'ca-dem', ...] }
// Nếu ngày chưa có config → hiện tất cả ca
export function getDayShifts() { return load('dayShifts', {}) }
export function saveDayShifts(ds) { save('dayShifts', ds) }
export function getSchedule() { return load('schedule', {}) }
export function saveSchedule(s) { save('schedule', s) }
export function getMessages() { return load('messages', []) }
export function saveMessages(m) { save('messages', m) }

// lastRead lưu theo từng cặp: { 'admin_userId': lastId, userId: lastId }
export function getLastRead() { return load('lastRead', {}) }
export function setLastRead(key, msgId) {
  const cur = load('lastRead', {})
  save('lastRead', { ...cur, [key]: msgId })
}
export function getCurrentUser() { return load('currentUser', null) }
export function setCurrentUser(u) { save('currentUser', u) }
export function logout() { localStorage.removeItem('currentUser') }
