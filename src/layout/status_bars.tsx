// Thin bars under the header: loading / error, and View / Edit mode for editors
import type { LoadStatus } from '../types'

// "Loading…" while the database wakes up, or "Try again" if something failed
export function LoadBar({ status, onRetry }: { status: LoadStatus; onRetry: () => void }) {
  if (status === 'loading') {
    return (
      <div className="status-bar loading" role="status">
        <span className="spinner" aria-hidden="true" /> Loading…
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="status-bar error" role="alert">
        <span>Couldn't load some info.</span>
        <button type="button" onClick={onRetry}>Try again</button>
      </div>
    )
  }
  return null
}

// Dark bar shown whenever this device is logged in: switch between View and Edit mode
export function AdminBar({ editing, onChange }: { editing: boolean; onChange: (editing: boolean) => void }) {
  return (
    <div className="admin-bar">
      <span>{editing ? '✏️ Edit mode' : '👁 View mode'}</span>
      <div className="mode-switch" role="group" aria-label="Mode">
        <button type="button" className={editing ? '' : 'active'} aria-pressed={!editing} onClick={() => onChange(false)}>View</button>
        <button type="button" className={editing ? 'active' : ''} aria-pressed={editing} onClick={() => onChange(true)}>Edit</button>
      </div>
    </div>
  )
}
