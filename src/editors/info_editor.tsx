// Edits a group of church-info fields (hero, about, footer, or announcement)
import { useState, type FormEvent } from 'react'
import type { Admin, ChurchInfo, InfoField } from '../types'
import { finishAdmin, sendAdmin } from '../lib/api'
import { TextField } from '../components/text_field'
import { FormActions } from '../components/form_actions'

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

  const done = () => { onSaved(); onClose() }

  async function save(e: FormEvent) {
    e.preventDefault()
    setStatus('Saving…')
    const res = await sendAdmin(admin, '/api/admin/info', 'PUT', form)
    await finishAdmin(res, admin, done, setStatus)
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
      <FormActions status={status} onCancel={onClose} />
    </form>
  )
}
