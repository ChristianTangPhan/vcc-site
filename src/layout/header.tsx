// Sticky top bar: church short name, ↻ refresh, and the page links
import type { MouseEvent } from 'react'
import type { ChurchInfo, LoadStatus } from '../types'

export type Page = 'home' | 'calendar' | 'admin'

export function Header({
  info,
  page,
  status,
  onRefresh,
}: {
  info: ChurchInfo | null
  page: Page
  status: LoadStatus
  onRefresh: () => void
}) {
  // On the home page, "Home" scrolls to the top instead of reloading
  function goHome(e: MouseEvent<HTMLAnchorElement>) {
    if (page !== 'home') return
    e.preventDefault()
    history.replaceState(null, '', '/') // clear any #section from the URL
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header className="nav">
      <div className="nav-top">
        <a href="/" className="nav-title" onClick={goHome}>{info?.i_abrv ?? info?.i_name}</a>
        <button
          type="button"
          className={`refresh-btn ${status === 'loading' ? 'spinning' : ''}`}
          onClick={onRefresh}
          disabled={status === 'loading'}
          aria-label="Refresh"
          title="Refresh"
        >
          ↻
        </button>
      </div>
      <nav>
        <a href="/" onClick={goHome} className={page === 'home' ? 'active' : ''}>Home</a>
        <a href="/calendar" className={page === 'calendar' ? 'active' : ''}>Calendar</a>
        <a href="/#services">Services</a>
        <a href="/#pastors">Pastors</a>
        <a href="/#about">About</a>
      </nav>
    </header>
  )
}
