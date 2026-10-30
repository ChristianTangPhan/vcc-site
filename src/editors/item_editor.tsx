// One form for one-time events AND weekly series.
// "Repeats every week" switches between them (and converts an existing one).
import { useState, type FormEvent } from 'react'
import type { Admin, EditTarget, Site } from '../types'
import { finishAdmin, sendAdmin } from '../lib/api'
import { dayNames, formatDateKey, formatTimeRange, fromKey, nextDateFor, toKey } from '../lib/dates'
import { TextField } from '../components/text_field'
import { TimeField } from '../components/time_field'
import { AddressCheck } from '../components/address_check'
import { FormActions } from '../components/form_actions'

export function ItemEditor({
  target,
  site,
  admin,
  onClose,
}: {
  target: EditTarget
  site: Site
  admin: Admin
  onClose: () => void
}) {
  const event = target.kind === 'event' ? target.event : null
  const series = target.kind === 'series' ? target.series : null
  const occurrence = target.kind === 'series' ? target.occurrence : undefined // the date it was opened from
  const isNew = target.kind === 'new'

  // Date shown when it's (or becomes) a one-time event
  const startDate =
    event?.e_date ??
    occurrence?.dateKey ??
    (series ? nextDateFor(series.s_day) : null) ??
    (target.kind === 'new' ? target.dateKey : undefined) ??
    toKey(new Date())

  // ===== Form state =====

  const [form, setForm] = useState({
    name: event?.e_name ?? series?.s_name ?? '',
    description: event?.e_description ?? series?.s_description ?? '',
    location: event?.e_location ?? series?.s_location ?? '',
    start: isNew ? '19:00' : ((event?.e_start ?? series?.s_start)?.slice(0, 5) ?? ''), // '' = no time
    end: isNew ? '20:00' : ((event?.e_end ?? series?.s_end)?.slice(0, 5) ?? ''),
    date: startDate,
    day: String(series?.s_day ?? fromKey(startDate).getDay() + 1), // 1 = Sunday
  })
  const [repeats, setRepeats] = useState(target.kind === 'series' || (target.kind === 'new' && !!target.repeats))
  const [isAddress, setIsAddress] = useState(event?.e_location_is_address ?? series?.s_location_is_address ?? false)
  const [showOnHome, setShowOnHome] = useState(series?.s_show_on_home ?? true)
  const [cancelIds, setCancelIds] = useState<string[]>([]) // other series to skip on this event's date
  const [presetId, setPresetId] = useState('')
  const [saveAsPreset, setSaveAsPreset] = useState(false)
  const [presetLabel, setPresetLabel] = useState('')
  const [reason, setReason] = useState('') // for "Cancel this date"
  const [status, setStatus] = useState('')

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }))
  const done = () => { site.reload.calendar(); onClose() }

  // Turning "repeats" on uses the chosen date's weekday
  function toggleRepeats(on: boolean) {
    setRepeats(on)
    if (on && form.date) set('day', String(fromKey(form.date).getDay() + 1))
  }

  // Other weekly series on this event's date (offered under "Also cancel on this day")
  const sameDaySeries = !repeats && form.date
    ? site.series.filter((s) => s.s_id !== series?.s_id && s.s_day - 1 === fromKey(form.date).getDay())
    : []

  const toggleCancel = (sId: string) =>
    setCancelIds((ids) => (ids.includes(sId) ? ids.filter((x) => x !== sId) : [...ids, sId]))

  // ===== Presets =====

  function applyPreset(id: string) {
    setPresetId(id)
    const p = site.presets.find((pr) => pr.ep_id === id)
    if (!p) return
    setForm((f) => ({
      ...f,
      name: p.ep_name ?? '',
      description: p.ep_description ?? '',
      location: p.ep_location ?? '',
      start: p.ep_start?.slice(0, 5) ?? '',
      end: p.ep_end?.slice(0, 5) ?? '',
    }))
    setIsAddress(!!p.ep_location_is_address)
    setPresetLabel(p.ep_label)
  }

  async function deletePreset() {
    const p = site.presets.find((pr) => pr.ep_id === presetId)
    if (!p || !confirm(`Delete the preset "${p.ep_label}"? (Things already added stay.)`)) return
    const res = await sendAdmin(admin, `/api/admin/presets?id=${p.ep_id}`, 'DELETE')
    await finishAdmin(res, admin, () => { setPresetId(''); site.reload.presets() }, setStatus)
  }

  // ===== Save / delete =====

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return setStatus('Name is required')
    if (!repeats && !form.date) return setStatus('Date is required')
    if (form.start && form.end && form.end <= form.start) return setStatus('End time must be after start time')

    // Switching kinds = make the new kind, then remove the old one
    if (series && !repeats && !confirm(
      `"${series.s_name}" will stop repeating: it becomes a one-time event on ${formatDateKey(form.date)}, and every other week is removed. Continue?`,
    )) return
    if (event && repeats && !confirm(
      `"${event.e_name}" will repeat every ${dayNames[Number(form.day) - 1]} instead of only ${formatDateKey(event.e_date)}. Continue?`,
    )) return

    setStatus('Saving…')

    // 1. Save as a series or an event
    let res = repeats
      ? await sendAdmin(admin, '/api/admin/series', 'POST', {
          s_id: series?.s_id ?? null,
          s_name: form.name,
          s_description: form.description,
          s_location: form.location,
          s_location_is_address: isAddress,
          s_day: Number(form.day),
          s_start: form.start,
          s_end: form.end,
          s_show_on_home: showOnHome,
        })
      : await sendAdmin(admin, '/api/admin/events', 'POST', {
          e_id: event?.e_id ?? null,
          e_name: form.name,
          e_description: form.description,
          e_location: form.location,
          e_location_is_address: isAddress,
          e_date: form.date,
          e_start: form.start,
          e_end: form.end,
        })
    if (!res.ok) return finishAdmin(res, admin, () => {}, setStatus)

    // 2. Remove the old one if it changed kind
    if (series && !repeats) res = await sendAdmin(admin, `/api/admin/series?id=${series.s_id}`, 'DELETE')
    if (event && repeats) res = await sendAdmin(admin, `/api/admin/events?id=${event.e_id}`, 'DELETE')
    if (!res.ok) return finishAdmin(res, admin, () => {}, setStatus)

    // 3. Skip the chosen series on this event's date
    if (!repeats) {
      for (const sId of cancelIds) {
        res = await sendAdmin(admin, '/api/admin/cancellations', 'POST', { s_id: sId, sc_date: form.date, sc_reason: form.name })
        if (!res.ok) return finishAdmin(res, admin, () => {}, setStatus)
      }
    }

    // 4. Save as a preset for next time
    if (saveAsPreset) {
      res = await sendAdmin(admin, '/api/admin/presets', 'POST', {
        ep_label: presetLabel.trim() || form.name,
        ep_name: form.name,
        ep_description: form.description,
        ep_location: form.location,
        ep_location_is_address: isAddress,
        ep_start: form.start,
        ep_end: form.end,
      })
      if (!res.ok) return finishAdmin(res, admin, () => {}, setStatus)
      site.reload.presets()
    }

    done()
  }

  async function remove() {
    if (event) {
      if (!confirm(`Delete "${event.e_name}" on ${formatDateKey(event.e_date)}?`)) return
      setStatus('Deleting…')
      const res = await sendAdmin(admin, `/api/admin/events?id=${event.e_id}`, 'DELETE')
      await finishAdmin(res, admin, done, setStatus)
    } else if (series) {
      if (!confirm(`Delete "${series.s_name}" for EVERY week? (To skip just one day, use "Cancel this date" instead.)`)) return
      setStatus('Deleting…')
      const res = await sendAdmin(admin, `/api/admin/series?id=${series.s_id}`, 'DELETE')
      await finishAdmin(res, admin, done, setStatus)
    }
  }

  // ===== Just this one date (series opened from a date) =====

  async function cancelDate() {
    if (!series || !occurrence) return
    setStatus('Saving…')
    const res = await sendAdmin(admin, '/api/admin/cancellations', 'POST', { s_id: series.s_id, sc_date: occurrence.dateKey, sc_reason: reason })
    await finishAdmin(res, admin, done, setStatus)
  }

  async function restoreDate() {
    if (!series || !occurrence) return
    setStatus('Saving…')
    const res = await sendAdmin(admin, `/api/admin/cancellations?s_id=${series.s_id}&date=${occurrence.dateKey}`, 'DELETE')
    await finishAdmin(res, admin, done, setStatus)
  }

  // ===== Form =====

  return (
    <form className="admin-form inline-editor" onSubmit={save}>
      <h3>{isNew ? 'Add' : repeats ? 'Edit weekly series' : 'Edit event'}</h3>

      {occurrence && (
        <div className="occurrence-box">
          <strong>{formatDateKey(occurrence.dateKey)} only</strong>
          {occurrence.cancelled ? (
            <>
              <p className="cal-cancelled">Cancelled{occurrence.reason ? `: ${occurrence.reason}` : ''}</p>
              <button type="button" className="small-btn" onClick={restoreDate}>Restore this date</button>
            </>
          ) : (
            <>
              <TextField label="Reason (optional)" value={reason} onChange={setReason} />
              <button type="button" className="small-btn danger-solid" onClick={cancelDate}>Cancel this date</button>
            </>
          )}
        </div>
      )}

      {site.presets.length > 0 && (
        <div className="preset-row">
          <label>
            <span>Start from a preset</span>
            <select value={presetId} onChange={(e) => applyPreset(e.target.value)}>
              <option value="">— None —</option>
              {site.presets.map((p) => <option key={p.ep_id} value={p.ep_id}>{p.ep_label}</option>)}
            </select>
          </label>
          {presetId && <button type="button" className="link-btn" onClick={deletePreset}>Delete preset</button>}
        </div>
      )}

      <TextField label="Name" value={form.name} onChange={(v) => set('name', v)} />

      <label className="check repeat-check">
        <input type="checkbox" checked={repeats} onChange={(e) => toggleRepeats(e.target.checked)} />
        Repeats every week
      </label>

      {repeats ? (
        <label>
          <span>Day</span>
          <select value={form.day} onChange={(e) => set('day', e.target.value)}>
            {dayNames.map((d, i) => <option key={d} value={i + 1}>Every {d}</option>)}
          </select>
        </label>
      ) : (
        <TextField label="Date" type="date" value={form.date} onChange={(v) => set('date', v)} />
      )}

      <div className="admin-row">
        <TimeField label="Start" value={form.start} onChange={(v) => set('start', v)} />
        <TimeField label="End" value={form.end} onChange={(v) => set('end', v)} />
      </div>

      <TextField label="Location" value={form.location} onChange={(v) => set('location', v)} />
      <AddressCheck checked={isAddress} onChange={setIsAddress} />
      <TextField label="Description (optional)" multiline value={form.description} onChange={(v) => set('description', v)} />

      {repeats && (
        <label className="check">
          <input type="checkbox" checked={showOnHome} onChange={(e) => setShowOnHome(e.target.checked)} />
          Show under "Service Times" on the home page
        </label>
      )}

      {sameDaySeries.length > 0 && (
        <fieldset className="check-group">
          <legend>Also cancel on this day</legend>
          {sameDaySeries.map((s) => (
            <label key={s.s_id} className="check">
              <input type="checkbox" checked={cancelIds.includes(s.s_id)} onChange={() => toggleCancel(s.s_id)} />
              {s.s_name}{s.s_start || s.s_end ? ` (${formatTimeRange(s.s_start, s.s_end)})` : ''}
            </label>
          ))}
        </fieldset>
      )}

      <label className="check">
        <input type="checkbox" checked={saveAsPreset} onChange={(e) => setSaveAsPreset(e.target.checked)} />
        Save as preset
      </label>
      {saveAsPreset && (
        <TextField label="Preset name (same name = update that preset)" value={presetLabel} onChange={setPresetLabel} />
      )}

      <FormActions status={status} onCancel={onClose} onDelete={event || series ? remove : undefined} sticky />
    </form>
  )
}
