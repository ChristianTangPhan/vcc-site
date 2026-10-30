// /admin: enter the admin key to unlock editing on this device (or log out)
import { useState, type FormEvent } from 'react'
import { getJson } from '../lib/api'

export function AdminPage({
  unlocked,
  onLogin,
  onLogout,
}: {
  unlocked: boolean
  onLogin: (key: string) => void
  onLogout: () => void
}) {
  return unlocked ? <Unlocked onLogout={onLogout} /> : <Login onLogin={onLogin} />
}

// Password box
function Login({ onLogin }: { onLogin: (key: string) => void }) {
  const [key, setKey] = useState('')
  const [status, setStatus] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setStatus('Checking…')
    let ok = true
    await getJson('/api/admin/check', null, { key: key.trim(), onFail: () => { ok = false } })
    if (ok) onLogin(key.trim())
    else setStatus('Wrong key')
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

// Already unlocked
function Unlocked({ onLogout }: { onLogout: () => void }) {
  return (
    <section id="admin">
      <h2>Admin</h2>
      <p>Editing is unlocked on this device. Tap anything on the home page or calendar to edit it.</p>
      <div className="admin-actions">
        <a href="/" className="section-link">Go to home page →</a>
        <button type="button" className="secondary" onClick={() => { onLogout(); window.location.href = '/' }}>Log out</button>
      </div>
    </section>
  )
}
