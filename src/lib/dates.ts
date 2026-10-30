import type { View } from '../types'

export const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// 24-hour to 12-hour: "19:00:00" -> "7:00 PM"
export function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`
}

// Times are optional. Returns null when there's nothing to show:
//   both  -> "7:00 PM – 8:00 PM"   start only -> "Starts 7:00 PM"
//   end only -> "Until 8:00 PM"     neither -> null
export function formatTimeRange(start: string | null | undefined, end: string | null | undefined) {
  if (start && end) return `${formatTime(start)} – ${formatTime(end)}`
  if (start) return `Starts ${formatTime(start)}`
  if (end) return `Until ${formatTime(end)}`
  return null
}

// Date -> "2026-11-01" (local time, matches the DB's date text)
export function toKey(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// "2026-11-01" -> Date (local time)
export function fromKey(k: string) {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// "2026-11-12" -> "Thursday, November 12"
export function formatDateKey(k: string) {
  return fromKey(k).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

// Sunday of the week containing d
export function startOfWeek(d: Date) {
  return addDays(d, -d.getDay())
}

// All dates the current view should show
export function getViewDays(anchor: Date, view: View) {
  let start: Date
  let count: number

  if (view === 'week') {
    start = startOfWeek(anchor)
    count = 8 // Sunday through next Sunday
  } else {
    // Full weeks covering the month (Sunday before the 1st -> Saturday after the last day)
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    start = startOfWeek(first)
    const end = addDays(startOfWeek(last), 6)
    count = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  }

  return Array.from({ length: count }, (_, i) => addDays(start, i))
}

export function getViewTitle(anchor: Date, view: View) {
  if (view === 'month') {
    return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  const s = startOfWeek(anchor)
  const e = addDays(s, 7) // through next Sunday
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(s)} – ${fmt(e)}, ${e.getFullYear()}`
}
