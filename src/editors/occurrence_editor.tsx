import { useState } from 'react'
import type { Admin, CalItem } from '../types'
import { finishAdmin, sendAdmin } from '../lib/admin'
import { formatDateKey, formatTimeRange } from '../lib/dates'
import { TextField } from '../components/text_field'

// Cancel or restore ONE date of a weekly series
export function OccurrenceEditor({
  item,
  admin,
  onSaved,
  onClose,
}: {
  item: CalItem
  admin: Admin
  onSaved: () => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState('')

  const done = () => { onSaved(); onClose() }

  async function cancelDate() {
    setStatus('Saving…')
    const res = await sendAdmin(admin, '/api/admin/cancellations', 'POST', {
      s_id: item.refId,
      sc_date: item.dateKey,
      sc_reason: reason,
    })
    await finishAdmin(res, admin, done, setStatus)
  }

  async function restore() {
    setStatus('Saving…')
    const res = await sendAdmin(
      admin,
      `/api/admin/cancellations?s_id=${item.refId}&date=${item.dateKey}`,
      'DELETE'
    )
    await finishAdmin(res, admin, done, setStatus)
  }

  return (
    <div className="admin-form inline-editor">
      <h3>{item.name}</h3>
      <p className="muted">
        {[formatDateKey(item.dateKey), formatTimeRange(item.start, item.end)].filter(Boolean).join(' · ')}
      </p>

      {item.cancelled ? (
        <>
          <p className="cal-cancelled">Cancelled{item.reason ? `: ${item.reason}` : ''}</p>
          <div className="admin-actions">
            <button type="button" onClick={restore}>Restore this date</button>
            <button type="button" className="secondary" onClick={onClose}>Close</button>
            <span className="muted">{status}</span>
          </div>
        </>
      ) : (
        <>
          <TextField label="Reason (shown on the calendar)" value={reason} onChange={setReason} />
          <div className="admin-actions">
            <button type="button" className="danger-solid" onClick={cancelDate}>Cancel this date</button>
            <button type="button" className="secondary" onClick={onClose}>Close</button>
            <span className="muted">{status}</span>
          </div>
        </>
      )}

      <p className="muted small-note">
        To change the day or time for every week, edit it under Service Times on the home page (editors see every series there).
      </p>
    </div>
  )
}
