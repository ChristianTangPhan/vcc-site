import { useState, type FormEvent } from 'react'

// /admin when locked: password box
function AdminLogin({ onLogin }: { onLogin: (key: string) => void }) {
  const [key, setKey] = useState('')
  const [status, setStatus] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setStatus('Checking…')
    const res = await fetch('/api/admin/check', {
      headers: { Authorization: `Bearer ${key.trim()}` },
    })
    if (res.ok) {
      onLogin(key.trim())
    } else {
      setStatus('Wrong key')
    }
  }

  return (
    <section id="admin">
      <h2>Admin</h2>
      <form className="admin-form" onSubmit={submit}>
        <label>
          <span>Admin key</span>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} autoFocus />
        </label>
        <div className="admin-actions">
          <button type="submit">Unlock</button>
          <span className="muted">{status}</span>
        </div>
      </form>
    </section>
  )
}

// /admin when already unlocked
function AdminUnlocked({ onLogout }: { onLogout: () => void }) {
  return (
    <section id="admin">
      <h2>Admin</h2>
      <p>Editing is unlocked on this device. Look for the ✏️ buttons on the home page, and + Add event on the calendar.</p>
      <div className="admin-actions">
        <a href="/" className="section-link">Go to home page →</a>
        <button type="button" className="secondary" onClick={onLogout}>Log out</button>
      </div>
    </section>
  )
}

// Shows the login box or the "unlocked" screen
export function AdminPage({
  unlocked,
  onLogin,
  onLogout,
}: {
  unlocked: boolean
  onLogin: (key: string) => void
  onLogout: () => void
}) {
  return unlocked ? <AdminUnlocked onLogout={onLogout} /> : <AdminLogin onLogin={onLogin} />
}
