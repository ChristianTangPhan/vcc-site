// Thin bars under the header: loading / error, and "Editing mode" for editors
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

// Dark bar shown while editing is unlocked on this device
export function AdminBar({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="admin-bar">
      <span>✏️ Editing mode</span>
      <button type="button" onClick={onLogout}>Log out</button>
    </div>
  )
}
