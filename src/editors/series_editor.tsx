import { useState, type FormEvent } from 'react'
import type { Admin, Series } from '../types'
import { finishAdmin, sendAdmin } from '../lib/admin'
import { dayNames } from '../lib/dates'
import { TextField } from '../components/text_field'
import { TimeField } from '../components/time_field'

// Add or edit one weekly series (no series passed = adding a new one)
export function SeriesEditor({
  series,
  admin,
  onSaved,
  onClose,
}: {
  series?: Series
  admin: Admin
  onSaved: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    s_name: series?.s_name ?? '',
    s_description: series?.s_description ?? '',
    s_location: series?.s_location ?? '',
    s_day: String(series?.s_day ?? 1),
    s_start: series ? (series.s_start?.slice(0, 5) ?? '') : '10:00', // "10:30:00" -> "10:30"; '' = no time
    s_end: series ? (series.s_end?.slice(0, 5) ?? '') : '11:00',
  })
  const [showOnHome, setShowOnHome] = useState(series?.s_show_on_home ?? true)
  const [status, setStatus] = useState('')

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const done = () => { onSaved(); onClose() }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form.s_name.trim()) return setStatus('Name is required')
    if (form.s_start && form.s_end && form.s_end <= form.s_start) return setStatus('End time must be after start time')
    setStatus('Saving…')
    const res = await sendAdmin(admin, '/api/admin/series', 'POST', {
      s_id: series?.s_id ?? null,
      ...form,
      s_day: Number(form.s_day),
      s_show_on_home: showOnHome,
    })
    await finishAdmin(res, admin, done, setStatus)
  }

  async function remove() {
    if (!series || !confirm(`Delete "${series.s_name}"? This also removes its cancellations.`)) return
    setStatus('Deleting…')
    const res = await sendAdmin(admin, `/api/admin/series?id=${series.s_id}`, 'DELETE')
    await finishAdmin(res, admin, done, setStatus)
  }

  return (
    <form className="admin-form inline-editor" onSubmit={save}>
      <h3>{series ? 'Edit weekly series' : 'Add weekly series'}</h3>
      <TextField label="Name" value={form.s_name} onChange={(v) => set('s_name', v)} />
      <label>
        <span>Day (repeats every week)</span>
        <select value={form.s_day} onChange={(e) => set('s_day', e.target.value)}>
          {dayNames.map((d, i) => (
            <option key={d} value={i + 1}>{d}</option>
          ))}
        </select>
      </label>
      <div className="admin-row">
        <TimeField label="Start" value={form.s_start} onChange={(v) => set('s_start', v)} />
        <TimeField label="End" value={form.s_end} onChange={(v) => set('s_end', v)} />
      </div>
      <TextField label="Location" value={form.s_location} onChange={(v) => set('s_location', v)} />
      <TextField label="Description (optional)" multiline value={form.s_description} onChange={(v) => set('s_description', v)} />
      <label className="check">
        <input type="checkbox" checked={showOnHome} onChange={(e) => setShowOnHome(e.target.checked)} />
        Show under "Service Times" on the home page
      </label>
      <div className="admin-actions">
        <button type="submit">Save</button>
        <button type="button" className="secondary" onClick={onClose}>Cancel</button>
        {series && <button type="button" className="danger" onClick={remove}>Delete</button>}
        <span className="muted">{status}</span>
      </div>
    </form>
  )
}
