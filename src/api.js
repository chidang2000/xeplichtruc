const BASE = 'https://xeplichtruc.onrender.com'

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Lỗi server')
  return data
}

export const api = {
  // Auth
  login: (username, password) => req('POST', '/auth/login', { username, password }),
  register: (name, username, password) => req('POST', '/auth/register', { name, username, password }),

  // Users
  getUsers: () => req('GET', '/users'),
  addUser: (data) => req('POST', '/users', data),
  updateUser: (id, data) => req('PUT', `/users/${id}`, data),
  deleteUser: (id) => req('DELETE', `/users/${id}`),

  // Shifts
  getShifts: () => req('GET', '/shifts'),
  addShift: (data) => req('POST', '/shifts', data),
  updateShift: (shiftId, data) => req('PUT', `/shifts/${shiftId}`, data),
  deleteShift: (shiftId) => req('DELETE', `/shifts/${shiftId}`),

  // Schedule
  getSchedule: (year, month) => req('GET', `/schedule?year=${year}&month=${month}`),
  updateSchedule: (date, shiftId, userIds) => req('PUT', `/schedule/${date}/${shiftId}`, { userIds }),
  getDayShifts: (year, month) => req('GET', `/schedule/dayshifts?year=${year}&month=${month}`),
  updateDayShifts: (date, activeShiftIds) => req('PUT', `/schedule/dayshifts/${date}`, { activeShiftIds }),

  // Messages
  getMessages: (userId) => req('GET', `/messages/${userId}`),
  sendMessage: (data) => req('POST', '/messages', data),
  getThreads: () => req('GET', '/messages/threads/list'),
}

// Session helpers (vẫn dùng localStorage cho current user)
export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
}
export function setCurrentUser(u) { localStorage.setItem('currentUser', JSON.stringify(u)) }
export function logoutUser() { localStorage.removeItem('currentUser') }
