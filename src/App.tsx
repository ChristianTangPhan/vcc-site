import { useEffect, useState } from 'react'
import './App.css'

// ===== Types (match the DB functions) =====
// Postgres bigint IDs arrive as strings in JSON
type Pastor = {
  p_id: string
  p_name: string
  p_phone_number: string
  p_email: string
  p_image: string | null
}

type Service = {
  s_id: string
  s_name: string
  s_description: string | null
  s_location: string
  s_day: number // 1 = Sunday ... 7 = Saturday
  s_start: string
  s_end: string
}

type Cancellation = {
  sc_id: string
  s_id: string
  sc_date: string // "2026-11-01"
  sc_reason: string | null
}

type ChurchInfo = {
  i_name: string | null
  i_abrv: string | null
  i_tagline: string | null
  i_about: string | null
  i_address: string | null
  i_phone: string | null
  i_email: string | null
  i_facebook: string | null
  i_youtube: string | null
  i_announcement: string | null
}

// One card on the calendar
type CalItem = {
  id: string
  name: string
  location: string | null
  start: string
  end: string
  cancelled: boolean
  reason: string | null
}

type View = 'week' | 'month'
type GetItems = (d: Date) => CalItem[]

// ===== Helpers =====
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// 24-hour to 12-hour: "19:00:00" -> "7:00 PM"
function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`
}

// Date -> "2026-11-01" (local time, matches sc_date)
function toKey(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

// Sunday of the week containing d
function startOfWeek(d: Date) {
  return addDays(d, -d.getDay())
}

// All dates the current view should show
function getViewDays(anchor: Date, view: View) {
  let start: Date
  let count: number

  if (view === 'week') {
    start = startOfWeek(anchor)
    count = 7
  } else {
    // Full weeks covering the month (Sunday before the 1st -> Saturday after the last day)
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    start = startOfWeek(first)
    const end = addDays(startOfWeek(last), 6)
    count = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  }

  return Array.from({ length: count }, (_, i) => addDays(start, i))
}

function getViewTitle(anchor: Date, view: View) {
  if (view === 'month') {
    return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  const s = startOfWeek(anchor)
  const e = addDays(s, 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(s)} – ${fmt(e)}, ${e.getFullYear()}`
}

// Apple Maps on Apple devices, Google Maps everywhere else
function mapsUrl(address: string) {
  const q = encodeURIComponent(address)
  const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
  return isApple
    ? `https://maps.apple.com/?q=${q}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`
}

// ===== Calendar pieces =====
function CalCard({ item, compact }: { item: CalItem; compact?: boolean }) {
  return (
    <div className={`cal-card ${item.cancelled ? 'cancelled' : ''}`}>
      <div className="cal-name">{item.name}</div>
      {!compact && item.location && <div className="cal-location">{item.location}</div>}
      {!compact && (
        <div className="cal-time">
          {formatTime(item.start)} – {formatTime(item.end)}
        </div>
      )}
      {!compact && item.cancelled && (
        <div className="cal-cancelled">
          Cancelled{item.reason ? `: ${item.reason}` : ''}
        </div>
      )}
    </div>
  )
}

// One day box (used by the week strip and the full calendar)
function DayCell({
  date,
  items,
  view,
  outside,
}: {
  date: Date
  items: CalItem[]
  view: View
  outside?: boolean
}) {
  const isToday = toKey(date) === toKey(new Date())

  return (
    <div className={`day ${isToday ? 'today' : ''} ${outside ? 'outside' : ''}`}>
      <div className="day-header">
        {view === 'week'
          ? `${dayNames[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`
          : date.getDate()}
      </div>
      {view === 'week' && items.length === 0 && <p className="muted day-empty">—</p>}
      {items.map((it) => (
        <CalCard key={it.id} item={it} compact={view === 'month'} />
      ))}
    </div>
  )
}

// Calendar page: week/month toggle + navigation
function Calendar({ getItems }: { getItems: GetItems }) {
  const [view, setView] = useState<View>('week')
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))

  const days = getViewDays(anchor, view)

  // Previous / next week or month
  function move(dir: 1 | -1) {
    setAnchor((a) =>
      view === 'week'
        ? addDays(a, 7 * dir)
        : new Date(a.getFullYear(), a.getMonth() + dir, 1)
    )
  }

  return (
    <>
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button onClick={() => move(-1)} aria-label="Previous">‹</button>
          <button onClick={() => setAnchor(startOfDay(new Date()))}>Today</button>
          <button onClick={() => move(1)} aria-label="Next">›</button>
        </div>

        <span className="cal-title">{getViewTitle(anchor, view)}</span>

        <div className="cal-views">
          <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>
            Week
          </button>
          <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>
            Month
          </button>
        </div>
      </div>

      {view === 'month' && (
        <div className="cal-weekdays">
          {shortDayNames.map((d) => <div key={d}>{d}</div>)}
        </div>
      )}

      <div className={`cal-grid ${view}`}>
        {days.map((d) => (
          <DayCell
            key={toKey(d)}
            date={d}
            items={getItems(d)}
            view={view}
            outside={view === 'month' && d.getMonth() !== anchor.getMonth()}
          />
        ))}
      </div>
    </>
  )
}

// ===== Pages =====
function HomePage({
  info,
  services,
  pastors,
  getItems,
}: {
  info: ChurchInfo | null
  services: Service[]
  pastors: Pastor[]
  getItems: GetItems
}) {
  const todayItems = getItems(startOfDay(new Date()))

  return (
    <>
      <section className="hero">
        <h1>{info?.i_name && `Welcome to ${info.i_name}`}</h1>
        <p>{info?.i_tagline}</p>
      </section>

      <section id="today">
        <h2>
          Today ·{' '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        {todayItems.length === 0 ? (
          <p className="muted">Nothing scheduled today.</p>
        ) : (
          todayItems.map((it) => <CalCard key={it.id} item={it} />)
        )}
        <a href="/calendar" className="section-link today-link">View full calendar →</a>
      </section>

      <section id="services">
        <h2>Service Times</h2>
        {services.map((s) => (
          <div className="card" key={s.s_id}>
            <h3>{s.s_name}</h3>
            <p>{dayNames[s.s_day - 1]} · {formatTime(s.s_start)} – {formatTime(s.s_end)}</p>
            <p className="muted">{s.s_location}</p>
            {s.s_description && <p>{s.s_description}</p>}
          </div>
        ))}
      </section>

      <section id="pastors">
        <h2>Our Pastors</h2>
        <div className={`pastor-row ${pastors.length === 1 ? 'single' : ''}`}>
          {pastors.map((p) => (
            <div className="card pastor-card" key={p.p_id}>
              {p.p_image && <img className="pastor-photo" src={p.p_image} alt={p.p_name} />}
              <h3>{p.p_name}</h3>
              <p><a href={`tel:${p.p_phone_number}`}>{p.p_phone_number}</a></p>
              <p><a href={`mailto:${p.p_email}`}>{p.p_email}</a></p>
            </div>
          ))}
        </div>
        {pastors.length > 1 && <p className="muted swipe-hint">Swipe to see more →</p>}
      </section>

      <section id="about">
        <h2>About Us</h2>
        <p className="about-text">{info?.i_about}</p>
      </section>
    </>
  )
}

function CalendarPage({ getItems }: { getItems: GetItems }) {
  return (
    <section id="calendar">
      <h2>Calendar</h2>
      <Calendar getItems={getItems} />
    </section>
  )
}

// ===== App (shared nav, announcement, footer + picks the page) =====
function App() {
  const [pastors, setPastors] = useState<Pastor[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [cancellations, setCancellations] = useState<Cancellation[]>([])
  const [info, setInfo] = useState<ChurchInfo | null>(null)

  // Which page: "/calendar" -> calendar, anything else -> home
  const page = window.location.pathname.startsWith('/calendar') ? 'calendar' : 'home'

  // Which announcement text this visitor already closed (saved in their browser)
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return localStorage.getItem('dismissedAnnouncement')
    } catch {
      return null
    }
  })

  // Load everything once when the page opens
  useEffect(() => {
    fetch('/api/pastors').then((r) => r.json()).then(setPastors)
    fetch('/api/services').then((r) => r.json()).then(setServices)
    fetch('/api/cancellations').then((r) => r.json()).then(setCancellations)
    fetch('/api/info').then((r) => r.json()).then(setInfo)
  }, [])

  // Browser tab title
  useEffect(() => {
    if (!info?.i_name) return
    document.title = page === 'calendar' ? `Calendar · ${info.i_name}` : info.i_name
  }, [info, page])

  // Services on a given date (weekly series, minus cancellations)
  function getItems(date: Date): CalItem[] {
    const key = toKey(date)
    return services
      .filter((s) => s.s_day - 1 === date.getDay())
      .map((s) => {
        const c = cancellations.find((c) => c.s_id === s.s_id && c.sc_date === key)
        return {
          id: `${s.s_id}-${key}`,
          name: s.s_name,
          location: s.s_location,
          start: s.s_start,
          end: s.s_end,
          cancelled: !!c,
          reason: c?.sc_reason ?? null,
        }
      })
      .sort((a, b) => a.start.localeCompare(b.start))
  }

  // Announcement: only show if there's text AND this visitor hasn't closed this exact text
  const announcement = info?.i_announcement?.trim() || null
  const showAnnouncement = !!announcement && announcement !== dismissed

  function dismissAnnouncement() {
    setDismissed(announcement)
    try {
      if (announcement) localStorage.setItem('dismissedAnnouncement', announcement)
    } catch {
      // storage blocked (private mode) - it just reappears next visit
    }
  }

  return (
    <>
      <header className="nav">
        <a href="/" className="nav-title">{info?.i_abrv ?? info?.i_name}</a>
        <nav>
          <a href="/#today">Today</a>
          <a href="/calendar" className={page === 'calendar' ? 'active' : ''}>Calendar</a>
          <a href="/#services">Services</a>
          <a href="/#pastors">Pastors</a>
          <a href="/#about">About</a>
        </nav>
      </header>

      {showAnnouncement && (
        <div className="announcement" role="alert">
          <p>{announcement}</p>
          <button onClick={dismissAnnouncement} aria-label="Dismiss announcement">×</button>
        </div>
      )}

      {page === 'calendar' ? (
        <CalendarPage getItems={getItems} />
      ) : (
        <HomePage info={info} services={services} pastors={pastors} getItems={getItems} />
      )}

      <footer>
        {info?.i_address && (
          <p>
            <a href={mapsUrl(info.i_address)} target="_blank" rel="noopener noreferrer">
              📍 {info.i_address}
            </a>
          </p>
        )}
        {info?.i_phone && <p><a href={`tel:${info.i_phone}`}>{info.i_phone}</a></p>}
        {info?.i_email && <p><a href={`mailto:${info.i_email}`}>{info.i_email}</a></p>}
        <p>
          {info?.i_facebook && <a href={info.i_facebook}>Facebook</a>}
          {info?.i_facebook && info?.i_youtube && ' · '}
          {info?.i_youtube && <a href={info.i_youtube}>YouTube</a>}
        </p>
        <p className="muted">© {new Date().getFullYear()} {info?.i_name}</p>
      </footer>
    </>
  )
}

export default App