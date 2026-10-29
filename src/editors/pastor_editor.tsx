import { useState, type FormEvent } from 'react'
import type { Admin, Pastor } from '../types'
import { finishAdmin, sendAdmin } from '../lib/admin'
import { TextField } from '../components/text_field'

// Add or edit one pastor (no pastor passed = adding a new one)
export function PastorEditor({
  pastor,
  admin,
  onSaved,
  onClose,
}: {
  pastor?: Pastor
  admin: Admin
  onSaved: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    p_name: pastor?.p_name ?? '',
    p_phone_number: pastor?.p_phone_number ?? '',
    p_email: pastor?.p_email ?? '',
    p_image: pastor?.p_image ?? '',
  })
  const [status, setStatus] = useState('')

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const done = () => { onSaved(); onClose() }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form.p_name.trim()) return setStatus('Name is required')
    setStatus('Saving…')
    const res = await sendAdmin(admin, '/api/admin/pastors', 'POST', {
      p_id: pastor?.p_id ?? null,
      ...form,
    })
    await finishAdmin(res, admin, done, setStatus)
  }

  async function remove() {
    if (!pastor || !confirm(`Delete ${pastor.p_name}?`)) return
    setStatus('Deleting…')
    const res = await sendAdmin(admin, `/api/admin/pastors?id=${pastor.p_id}`, 'DELETE')
    await finishAdmin(res, admin, done, setStatus)
  }

  return (
    <form className="admin-form inline-editor" onSubmit={save}>
      <h3>{pastor ? 'Edit pastor' : 'Add pastor'}</h3>
      <TextField label="Name" value={form.p_name} onChange={(v) => set('p_name', v)} />
      <TextField label="Phone" type="tel" value={form.p_phone_number} onChange={(v) => set('p_phone_number', v)} />
      <TextField label="Email" type="email" value={form.p_email} onChange={(v) => set('p_email', v)} />
      <TextField label="Photo link (e.g. /pastors/name.jpg)" value={form.p_image} onChange={(v) => set('p_image', v)} />
      <div className="admin-actions">
        <button type="submit">Save</button>
        <button type="button" className="secondary" onClick={onClose}>Cancel</button>
        {pastor && <button type="button" className="danger" onClick={remove}>Delete</button>}
        <span className="muted">{status}</span>
      </div>
    </form>
  )
}
