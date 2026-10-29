import type { Admin } from '../types'

// ===== Admin key (saved on this device) =====
const ADMIN_KEY_STORAGE = 'adminKey'

export function loadAdminKey() {
  try {
    return localStorage.getItem(ADMIN_KEY_STORAGE)
  } catch {
    return null
  }
}

export function saveAdminKey(key: string) {
  try {
    localStorage.setItem(ADMIN_KEY_STORAGE, key)
  } catch {
    // storage blocked (private mode) - stays unlocked only until the page closes
  }
}

export function clearAdminKey() {
  try {
    localStorage.removeItem(ADMIN_KEY_STORAGE)
  } catch {
    // storage blocked - nothing to remove
  }
}

// ===== Admin requests =====
// Sends a request to /api/admin/... with the admin key attached
export function sendAdmin(admin: Admin, url: string, method: string, body?: unknown) {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${admin.key}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

// After a save/delete: success -> done, wrong key -> log out, else show the error
export async function finishAdmin(
  res: Response,
  admin: Admin,
  onDone: () => void,
  setStatus: (s: string) => void
) {
  if (res.ok) return onDone()
  if (res.status === 401) return admin.logout()
  setStatus(`Error: ${await res.text()}`)
}
