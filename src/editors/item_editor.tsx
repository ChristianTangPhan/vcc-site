import { useState, type FormEvent } from 'react'
import type { Admin, EventRow, Preset, Series } from '../types'
import { finishAdmin, sendAdmin } from '../lib/admin'
import { addDays, dayNames, formatDateKey, formatTimeRange, fromKey, startOfDay, toKey } from '../lib/dates'
import { TextField } from '../components/text_field'
import { TimeField } from '../components/time_field'
import { AddressCheck } from '../components/address_check'

// What's being edited: an existing event, an existing weekly series, or something new
export type EditTarget =
  | { kind: 'event'; event: EventRow }
  | { kind: 'series'; series: Series; occurrence?: { dateKey: string; cancelled: boolean; reason: string | null } }
  | { kind: 'new'; dateKey?: string; repeats?: boolean }

// "2026-11-12" for the next date (today or later) that falls on s_day (1 = Sunday)
function nextDateFor(sDay: number) {
  const today = startOfDay(new Date())
  return toKey(addDays(today, (sDay - 1 - today.getDay() + 7) % 7))
}

// One form for both one-time events and weekly series.
// "Repeats every week" switches between them (and can convert an existing one).
export function ItemEditor({
  target,
  series,
  presets,
  admin,
  onSaved,
  onPresetsChanged,
  onClose,
}: {
  target: EditTarget
  series: Series[]
  presets: Preset[]
  admin: Admin
  onSaved: () => void // reload events + series + cancellations
  onPresetsChanged: () => void
  onClose: () => void
}) {
  const ev = target.kind === 'event' ? target.event : null
  const sr = target.kind === 'series' ? target.series : null
  const isNew = target.kind === 'new'

  const startDate =
    ev?.e_date ??
    (target.kind === 'series' ? (target.occurrence?.dateKey ?? nextDateFor(target.series.s_day)) : null) ??
    (target.kind === 'new' ? target.dateKey : undefined) ??
    toKey(new Date())

  const [form, setForm] = useState({
    name: ev?.e_name ?? sr?.s_name ?? '',
    description: ev?.e_description ?? sr?.s_description ?? '',
    location: ev?.e_location ?? sr?.s_location ?? '',
    start: isNew ? '19:00' : ((ev?.e_start ?? sr?.s_start)?.slice(0, 5) ?? ''), // '' = no time
    end: isNew ? '20:00' : ((ev?.e_end ?? sr?.s_end)?.slice(0, 5) ?? ''),
    date: startDate,
    day: String(sr?.s_day ?? fromKey(startDate).getDay() + 1), // 1 = Sunday
  })
  const [repeats, setRepeats] = useState(target.kind === 'series' || (target.kind === 'new' && !!target.repeats))
  const [isAddress, setIsAddress] = useState(ev?.e_location_is_address ?? sr?.s_location_is_address ?? false)
  const [showOnHome, setShowOnHome] = useState(sr?.s_show_on_home ?? true)
  const [cancelIds, setCancelIds] = useState<string[]>([]) // series to skip on this event's date
  const [presetId, setPresetId] = useState('')
  const [saveAsPreset, setSaveAsPreset] = useState(false)
  const [presetLabel, setPresetLabel] = useState('')
  const [reason, setReason] = useState('') // for "cancel this date"
  const [status, setStatus] = useState('')

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Turning "repeats" on uses the chosen date's weekday
  function toggleRepeats(on: boolean) {
    setRepeats(on)
    if (on && form.date) set('day', String(fromKey(form.date).getDay() + 1))
  }

  // Other series on this event's date (to optionally skip that day)
  const sameDaySeries =
    !repeats && form.date
      ? series.filter((s) => s.s_id !== sr?.s_id && s.s_day - 1 === fromKey(form.date).getDay())
      : []

  function applyPreset(id: string) {
    setPresetId(id)
    const p = presets.find((pr) => pr.ep_id === id)
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
    const p = presets.find((pr) => pr.ep_id === presetId)
    if (!p || !confirm(`Delete the preset "${p.ep_label}"? (Things already added stay.)`)) return
    const res = await sendAdmin(admin, `/api/admin/presets?id=${p.ep_id}`, 'DELETE')
    await finishAdmin(res, admin, () => { setPresetId(''); onPresetsChanged() }, setStatus)
  }

  const done = () => { onSaved(); onClose() }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return setStatus('Name is required')
    if (!repeats && !form.date) return setStatus('Date is required')
    if (form.start && form.end && form.end <= form.start) return setStatus('End time must be after start time')

    // Switching an existing one between weekly and one-time = make the new kind, then remove the old
    if (sr && !repeats &&
      !confirm(`"${sr.s_name}" will stop repeating: it becomes a one-time event on ${formatDateKey(form.date)}, and every other week is removed. Continue?`)) return
    if (ev && repeats &&
      !confirm(`"${ev.e_name}" will repeat every ${dayNames[Number(form.day) - 1]} instead of only ${formatDateKey(ev.e_date)}. Continue?`)) return

    setStatus('Saving…')
    const shared = {
      description: form.description,
      location: form.location,
      start: form.start,
      end: form.end,
      isAddress,
    }

    let res: Response
    if (repeats) {
      res = await sendAdmin(admin, '/api/admin/series', 'POST', {
        s_id: sr?.s_id ?? null,
        s_name: form.name,
        s_description: shared.description,
        s_location: shared.location,
        s_location_is_address: isAddress,
        s_day: Number(form.day),
        s_start: shared.start,
        s_end: shared.end,
        s_show_on_home: showOnHome,
      })
    } else {
      res = await sendAdmin(admin, '/api/admin/events', 'POST', {
        e_id: ev?.e_id ?? null,
        e_name: form.name,
        e_description: shared.description,
        e_location: shared.location,
        e_location_is_address: isAddress,
        e_date: form.date,
        e_start: shared.start,
        e_end: shared.end,
      })
    }
    if (!res.ok) return finishAdmin(res, admin, () => {}, setStatus)

    // Remove the old one if the kind changed
    if (sr && !repeats) res = await sendAdmin(admin, `/api/admin/series?id=${sr.s_id}`, 'DELETE')
    if (ev && repeats) res = await sendAdmin(admin, `/api/admin/events?id=${ev.e_id}`, 'DELETE')
    if (!res.ok) return finishAdmin(res, admin, () => {}, setStatus)

    // Skip the chosen series on this event's date
    if (!repeats) {
      for (const sId of cancelIds) {
        res = await sendAdmin(admin, '/api/admin/cancellations', 'POST', { s_id: sId, sc_date: form.date, sc_reason: form.name })
        if (!res.ok) return finishAdmin(res, admin, () => {}, setStatus)
      }
    }

    if (saveAsPreset) {
      res = await sendAdmin(admin, '/api/admin/presets', 'POST', {
        ep_label: presetLabel.trim() || form.name,
        ep_name: form.name,
        ep_description: shared.description,
        ep_location: shared.location,
        ep_start: shared.start,
        ep_end: shared.end,
        ep_location_is_address: isAddress,
      })
      if (!res.ok) return finishAdmin(res, admin, () => {}, setStatus)
      onPresetsChanged()
    }

    done()
  }

  async function remove() {
    if (ev) {
      if (!confirm(`Delete "${ev.e_name}" on ${formatDateKey(ev.e_date)}?`)) return
      setStatus('Deleting…')
      const res = await sendAdmin(admin, `/api/admin/events?id=${ev.e_id}`, 'DELETE')
      return finishAdmin(res, admin, done, setStatus)
    }
    if (sr) {
      if (!confirm(`Delete "${sr.s_name}" for EVERY week? (To skip just one day, use "Cancel this date" instead.)`)) return
      setStatus('Deleting…')
      const res = await sendAdmin(admin, `/api/admin/series?id=${sr.s_id}`, 'DELETE')
      return finishAdmin(res, admin, done, setStatus)
    }
  }

  // Skip / restore just the date this series was opened from
  const occ = target.kind === 'series' ? target.occurrence : undefined
  async function cancelDate() {
    if (!sr || !occ) return
    setStatus('Saving…')
    const res = await sendAdmin(admin, '/api/admin/cancellations', 'POST', { s_id: sr.s_id, sc_date: occ.dateKey, sc_reason: reason })
    await finishAdmin(res, admin, done, setStatus)
  }
  async function restoreDate() {
    if (!sr || !occ) return
    setStatus('Saving…')
    const res = await sendAdmin(admin, `/api/admin/cancellations?s_id=${sr.s_id}&date=${occ.dateKey}`, 'DELETE')
    await finishAdmin(res, admin, done, setStatus)
  }

  const title = isNew ? 'Add' : repeats ? 'Edit weekly series' : 'Edit event'

  return (
    <form className="admin-form inline-editor" onSubmit={save}>
      <h3>{title}</h3>

      {/* Just this one date of a weekly series */}
      {occ && (
        <div className="occurrence-box">
          <strong>{formatDateKey(occ.dateKey)} only</strong>
          {occ.cancelled ? (
            <>
              <p className="cal-cancelled">Cancelled{occ.reason ? `: ${occ.reason}` : ''}</p>
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

      <TextField label="Name" value={form.name} onChange={(v) => set('name', v)} />

      <label className="check repeat-check">
        <input type="checkbox" checked={repeats} onChange={(e) => toggleRepeats(e.target.checked)} />
        Repeats every week
      </label>

      {repeats ? (
        <label>
          <span>Day</span>
          <select value={form.day} onChange={(e) => set('day', e.target.value)}>
            {dayNames.map((d, i) => (
              <option key={d} value={i + 1}>Every {d}</option>
            ))}
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
              <input
                type="checkbox"
                checked={cancelIds.includes(s.s_id)}
                onChange={() =>
                  setCancelIds((ids) => (ids.includes(s.s_id) ? ids.filter((x) => x !== s.s_id) : [...ids, s.s_id]))
                }
              />
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

      <div className="admin-actions sticky-actions">
        <button type="submit">Save</button>
        <button type="button" className="secondary" onClick={onClose}>Cancel</button>
        {(ev || sr) && <button type="button" className="danger" onClick={remove}>Delete</button>}
        {status && <span className="muted status-text">{status}</span>}
      </div>
    </form>
  )
}
