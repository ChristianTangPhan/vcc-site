import { useState, type FormEvent } from 'react'
import type { Admin, ChurchInfo, InfoField } from '../types'
import { finishAdmin, sendAdmin } from '../lib/admin'
import { TextField } from '../components/text_field'

// Church info editor (announcement, hero, about, footer)
export function InfoEditor({
  info,
  fields,
  admin,
  onSaved,
  onClose,
}: {
  info: ChurchInfo
  fields: InfoField[]
  admin: Admin
  onSaved: () => void
  onClose: () => void
}) {
  // Copy of ALL info, so saving one section doesn't wipe the others
  const [form, setForm] = useState<ChurchInfo>(info)
  const [status, setStatus] = useState('')

  async function save(e: FormEvent) {
    e.preventDefault() // stop the browser from reloading the page
    setStatus('Saving…')
    const res = await sendAdmin(admin, '/api/admin/info', 'PUT', form)
    await finishAdmin(res, admin, () => { onSaved(); onClose() }, setStatus)
  }

  return (
    <form className="admin-form inline-editor" onSubmit={save}>
      {fields.map((f) => (
        <TextField
          key={f.key}
          label={f.label}
          multiline={f.multiline}
          value={form[f.key] ?? ''}
          onChange={(v) => setForm((old) => ({ ...old, [f.key]: v }))}
        />
      ))}
      <div className="admin-actions">
        <button type="submit">Save</button>
        <button type="button" className="secondary" onClick={onClose}>Cancel</button>
        <span className="muted">{status}</span>
      </div>
    </form>
  )
}
