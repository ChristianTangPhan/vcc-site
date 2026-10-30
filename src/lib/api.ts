// Talking to the API: public reads (getJson) and editor saves (sendAdmin + finishAdmin)
import type { Admin } from '../types'

// GET JSON; on failure logs which URL failed, calls onFail, and returns the fallback
// (so one bad request doesn't blank the whole page)
export async function getJson<T>(url: string, fallback: T, options: { key?: string; onFail?: () => void } = {}): Promise<T> {
  try {
    const headers = options.key ? { Authorization: `Bearer ${options.key}` } : undefined
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error(`Failed to load ${url}:`, err)
    options.onFail?.()
    return fallback
  }
}

// Send a request to /api/admin/... with the admin key attached
export function sendAdmin(admin: Admin, url: string, method: string, body?: unknown) {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin.key}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

// After a save/delete: success -> onDone, wrong key -> log out, otherwise show the error
export async function finishAdmin(res: Response, admin: Admin, onDone: () => void, setStatus: (s: string) => void) {
  if (res.ok) return onDone()
  if (res.status === 401) return admin.logout()
  setStatus(`Error: ${await res.text()}`)
}
