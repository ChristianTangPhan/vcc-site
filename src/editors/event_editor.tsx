import { useState, type FormEvent } from 'react'
import type { Admin, EventRow, Preset, Series } from '../types'
import { finishAdmin, sendAdmin } from '../lib/admin'
import { formatDateKey, formatTime, fromKey, toKey } from '../lib/dates'
import { TextField } from '../components/text_field'

// Add or edit one event, with presets and "also cancel this day's series"
export function EventEditor({
  event,
  initialDate,
  series,
  presets,
  admin,
  onSaved,
  onPresetsChanged,
  onClose,
}: {
  event?: EventRow
  initialDate?: string
  series: Series[]
  presets: Preset[]
  admin: Admin
  onSaved: () => void
  onPresetsChanged: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    e_name: event?.e_name ?? '',
    e_description: event?.e_description ?? '',
    e_location: event?.e_location ?? '',
    e_date: event?.e_date ?? initialDate ?? toKey(new Date()),
    e_start: event?.e_start?.slice(0, 5) ?? '19:00',
    e_end: event?.e_end?.slice(0, 5) ?? '20:00',
  })
  const [presetId, setPresetId] = useState('')
  const [cancelIds, setCancelIds] = useState<string[]>([]) // series to cancel on this date
  const [saveAsPreset, setSaveAsPreset] = useState(false)
  const [presetLabel, setPresetLabel] = useState('')
  const [status, setStatus] = useState('')

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Series that normally happen on the chosen date's weekday
  const sameDaySeries = form.e_date
    ? series.filter((s) => s.s_day - 1 === fromKey(form.e_date).getDay())
    : []

  // Fill the form from a preset (date stays the same)
  function applyPreset(id: string) {
    setPresetId(id)
    const p = presets.find((pr) => pr.ep_id === id)
    if (!p) return
    setForm((f) => ({
      ...f,
      e_name: p.ep_name ?? '',
      e_description: p.ep_description ?? '',
      e_location: p.ep_location ?? '',
      e_start: p.ep_start?.slice(0, 5) ?? f.e_start,
      e_end: p.ep_end?.slice(0, 5) ?? f.e_end,
    }))
    setPresetLabel(p.ep_label)
  }

  function toggleCancel(sId: string) {
    setCancelIds((ids) => (ids.includes(sId) ? ids.filter((x) => x !== sId) : [...ids, sId]))
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form.e_name.trim()) return setStatus('Name is required')
    if (!form.e_date) return setStatus('Date is required')
    if (form.e_end <= form.e_start) return setStatus('End time must be after start time')
    setStatus('Saving…')

    // 1. The event itself
    let res = await sendAdmin(admin, '/api/admin/events', 'POST', {
      e_id: event?.e_id ?? null,
      ...form,
    })
    if (!res.ok) return finishAdmin(res, admin, () => {}, setStatus)

    // 2. Cross out the series it replaces that day
    for (const sId of cancelIds) {
      res = await sendAdmin(admin, '/api/admin/cancellations', 'POST', {
        s_id: sId,
        sc_date: form.e_date,
        sc_reason: form.e_name,
      })
      if (!res.ok) return finishAdmin(res, admin, () => {}, setStatus)
    }

    // 3. Save as a preset for next time
    if (saveAsPreset) {
      res = await sendAdmin(admin, '/api/admin/presets', 'POST', {
        ep_label: presetLabel.trim() || form.e_name,
        ep_name: form.e_name,
        ep_description: form.e_description,
        ep_location: form.e_location,
        ep_start: form.e_start,
        ep_end: form.e_end,
      })
      if (!res.ok) return finishAdmin(res, admin, () => {}, setStatus)
      onPresetsChanged()
    }

    onSaved()
    onClose()
  }

  async function remove() {
    if (!event || !confirm(`Delete "${event.e_name}" on ${formatDateKey(event.e_date)}?`)) return
    setStatus('Deleting…')
    const res = await sendAdmin(admin, `/api/admin/events?id=${event.e_id}`, 'DELETE')
    await finishAdmin(res, admin, () => { onSaved(); onClose() }, setStatus)
  }

  async function deletePreset() {
    const p = presets.find((pr) => pr.ep_id === presetId)
    if (!p || !confirm(`Delete the preset "${p.ep_label}"? (Events already added stay.)`)) return
    const res = await sendAdmin(admin, `/api/admin/presets?id=${p.ep_id}`, 'DELETE')
    await finishAdmin(res, admin, () => { setPresetId(''); onPresetsChanged() }, setStatus)
  }

  return (
    <form className="admin-form inline-editor" onSubmit={save}>
      <h3>{event ? 'Edit event' : 'Add event'}</h3>

      {presets.length > 0 && (
        <div className="preset-row">
          <label>
            <span>Start from a preset</span>
            <select value={presetId} onChange={(e) => applyPreset(e.target.value)}>
              <option value="">— None —</option>
              {presets.map((p) => (
                <option key={p.ep_id} value={p.ep_id}>{p.ep_label}</option>
              ))}
            </select>
          </label>
          {presetId && (
            <button type="button" className="link-btn" onClick={deletePreset}>Delete preset</button>
          )}
        </div>
      )}

      <TextField label="Date" type="date" value={form.e_date} onChange={(v) => set('e_date', v)} />
      <TextField label="Name" value={form.e_name} onChange={(v) => set('e_name', v)} />
      <div className="admin-row">
        <TextField label="Start" type="time" value={form.e_start} onChange={(v) => set('e_start', v)} />
        <TextField label="End" type="time" value={form.e_end} onChange={(v) => set('e_end', v)} />
      </div>
      <TextField label="Location (house, restaurant…)" value={form.e_location} onChange={(v) => set('e_location', v)} />
      <TextField label="Description (optional)" multiline value={form.e_description} onChange={(v) => set('e_description', v)} />

      {sameDaySeries.length > 0 && (
        <fieldset className="check-group">
          <legend>Also cancel on this day</legend>
          {sameDaySeries.map((s) => (
            <label key={s.s_id} className="check">
              <input
                type="checkbox"
                checked={cancelIds.includes(s.s_id)}
                onChange={() => toggleCancel(s.s_id)}
              />
              {s.s_name} ({formatTime(s.s_start)})
            </label>
          ))}
        </fieldset>
      )}

      <label className="check">
        <input type="checkbox" checked={saveAsPreset} onChange={(e) => setSaveAsPreset(e.target.checked)} />
        Save as preset
      </label>
      {saveAsPreset && (
        <TextField
          label="Preset name (same name = update that preset)"
          value={presetLabel}
          onChange={setPresetLabel}
        />
      )}

      <div className="admin-actions">
        <button type="submit">Save</button>
        <button type="button" className="secondary" onClick={onClose}>Cancel</button>
        {event && <button type="button" className="danger" onClick={remove}>Delete</button>}
        <span className="muted">{status}</span>
      </div>
    </form>
  )
}
