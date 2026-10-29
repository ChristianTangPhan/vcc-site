import { useState, type FormEvent } from 'react'
import type { Admin, Service } from '../types'
import { finishAdmin, sendAdmin } from '../lib/admin'
import { dayNames } from '../lib/dates'
import { TextField } from '../components/text_field'

// Add or edit one weekly service (no service passed = adding a new one)
export function ServiceEditor({
  service,
  admin,
  onSaved,
  onClose,
}: {
  service?: Service
  admin: Admin
  onSaved: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    s_name: service?.s_name ?? '',
    s_description: service?.s_description ?? '',
    s_location: service?.s_location ?? '',
    s_day: String(service?.s_day ?? 1),
    s_start: service?.s_start?.slice(0, 5) ?? '10:00', // "10:30:00" -> "10:30" for the time box
    s_end: service?.s_end?.slice(0, 5) ?? '11:00',
  })
  const [status, setStatus] = useState('')

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const done = () => { onSaved(); onClose() }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form.s_name.trim()) return setStatus('Name is required')
    if (form.s_end <= form.s_start) return setStatus('End time must be after start time')
    setStatus('Saving…')
    const res = await sendAdmin(admin, '/api/admin/services', 'POST', {
      s_id: service?.s_id ?? null,
      ...form,
      s_day: Number(form.s_day),
    })
    await finishAdmin(res, admin, done, setStatus)
  }

  async function remove() {
    if (!service || !confirm(`Delete "${service.s_name}"? This also removes its cancellations.`)) return
    setStatus('Deleting…')
    const res = await sendAdmin(admin, `/api/admin/services?id=${service.s_id}`, 'DELETE')
    await finishAdmin(res, admin, done, setStatus)
  }

  return (
    <form className="admin-form inline-editor" onSubmit={save}>
      <h3>{service ? 'Edit service' : 'Add service'}</h3>
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
        <TextField label="Start" type="time" value={form.s_start} onChange={(v) => set('s_start', v)} />
        <TextField label="End" type="time" value={form.s_end} onChange={(v) => set('s_end', v)} />
      </div>
      <TextField label="Location" value={form.s_location} onChange={(v) => set('s_location', v)} />
      <TextField label="Description (optional)" multiline value={form.s_description} onChange={(v) => set('s_description', v)} />
      <div className="admin-actions">
        <button type="submit">Save</button>
        <button type="button" className="secondary" onClick={onClose}>Cancel</button>
        {service && <button type="button" className="danger" onClick={remove}>Delete</button>}
        <span className="muted">{status}</span>
      </div>
    </form>
  )
}
