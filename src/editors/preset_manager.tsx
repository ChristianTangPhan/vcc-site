import { useState, type FormEvent } from 'react'
import type { Admin, Preset } from '../types'
import { finishAdmin, sendAdmin } from '../lib/admin'
import { formatTime } from '../lib/dates'
import { TextField } from '../components/text_field'

// Form to add or edit one preset (no preset passed = adding a new one)
function PresetForm({
  preset,
  admin,
  onSaved,
  onCancel,
}: {
  preset?: Preset
  admin: Admin
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    ep_label: preset?.ep_label ?? '',
    ep_name: preset?.ep_name ?? '',
    ep_description: preset?.ep_description ?? '',
    ep_location: preset?.ep_location ?? '',
    ep_start: preset?.ep_start?.slice(0, 5) ?? '19:00',
    ep_end: preset?.ep_end?.slice(0, 5) ?? '20:00',
  })
  const [status, setStatus] = useState('')

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form.ep_label.trim()) return setStatus('Preset name is required')
    if (form.ep_end <= form.ep_start) return setStatus('End time must be after start time')
    setStatus('Saving…')

    // Existing preset -> PUT (edit by id, allows renaming); new -> POST
    const res = preset
      ? await sendAdmin(admin, '/api/admin/presets', 'PUT', { ep_id: preset.ep_id, ...form })
      : await sendAdmin(admin, '/api/admin/presets', 'POST', form)

    await finishAdmin(res, admin, onSaved, setStatus)
  }

  return (
    <form className="admin-form preset-form" onSubmit={save}>
      <TextField label="Preset name (shown in the dropdown)" value={form.ep_label} onChange={(v) => set('ep_label', v)} />
      <TextField label="Event name" value={form.ep_name} onChange={(v) => set('ep_name', v)} />
      <div className="admin-row">
        <TextField label="Start" type="time" value={form.ep_start} onChange={(v) => set('ep_start', v)} />
        <TextField label="End" type="time" value={form.ep_end} onChange={(v) => set('ep_end', v)} />
      </div>
      <TextField label="Location" value={form.ep_location} onChange={(v) => set('ep_location', v)} />
      <TextField label="Description (optional)" multiline value={form.ep_description} onChange={(v) => set('ep_description', v)} />
      <div className="admin-actions">
        <button type="submit">Save</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        <span className="muted">{status}</span>
      </div>
    </form>
  )
}

// List of all presets with Edit / Delete, plus + Add preset
export function PresetManager({
  presets,
  admin,
  onChanged,
}: {
  presets: Preset[]
  admin: Admin
  onChanged: () => void
}) {
  // Which one is being edited: a preset id, 'new', or nothing
  const [editing, setEditing] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  function saved() {
    setEditing(null)
    onChanged()
  }

  async function remove(p: Preset) {
    if (!confirm(`Delete the preset "${p.ep_label}"? (Events already added stay.)`)) return
    const res = await sendAdmin(admin, `/api/admin/presets?id=${p.ep_id}`, 'DELETE')
    await finishAdmin(res, admin, onChanged, setStatus)
  }

  return (
    <div className="admin-form inline-editor">
      <h3>Event presets</h3>

      {presets.length === 0 && <p className="muted">No presets yet.</p>}

      {presets.map((p) =>
        editing === p.ep_id ? (
          <PresetForm key={p.ep_id} preset={p} admin={admin} onSaved={saved} onCancel={() => setEditing(null)} />
        ) : (
          <div className="preset-item" key={p.ep_id}>
            <div>
              <div className="cal-name">{p.ep_label}</div>
              <div className="cal-time">
                {p.ep_start && p.ep_end ? `${formatTime(p.ep_start)} – ${formatTime(p.ep_end)}` : ''}
                {p.ep_location ? ` · ${p.ep_location}` : ''}
              </div>
            </div>
            <div className="preset-item-actions">
              <button type="button" className="link-btn edit" onClick={() => setEditing(p.ep_id)}>Edit</button>
              <button type="button" className="link-btn" onClick={() => remove(p)}>Delete</button>
            </div>
          </div>
        )
      )}

      {editing === 'new' ? (
        <PresetForm admin={admin} onSaved={saved} onCancel={() => setEditing(null)} />
      ) : (
        <button type="button" className="add-btn" onClick={() => setEditing('new')}>
          + Add preset
        </button>
      )}

      <span className="muted">{status}</span>
    </div>
  )
}
