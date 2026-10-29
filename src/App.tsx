import { useEffect, useState, type MouseEvent } from 'react'
import './App.css'

import type {
  Admin,
  CalItem,
  Cancellation,
  ChurchInfo,
  EditInfo,
  EventRow,
  Pastor,
  Preset,
  Series,
} from './types'
import { addDays, startOfDay, startOfWeek, toKey } from './lib/dates'
import { clearAdminKey, loadAdminKey, saveAdminKey } from './lib/admin'
import { mapsUrl } from './lib/maps'
import { announcementFields, contactFields } from './lib/info_fields'
import { Editable } from './components/editable'
import { InfoEditor } from './editors/info_editor'
import { HomePage } from './pages/home_page'
import { CalendarPage } from './pages/calendar_page'
import { AdminPage } from './pages/admin_page'

// How many weeks ahead weekly series show on the calendar (slides forward every Sunday)
const SERIES_WEEKS_AHEAD = 4

// Fetch JSON; if it fails, log which one and use a fallback,
// so one bad request doesn't blank the whole page
async function getJson<T>(url: string, fallback: T, headers?: HeadersInit): Promise<T> {
  try {
    const r = await fetch(url, { headers })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  } catch (err) {
    console.error(`Failed to load ${url}:`, err)
    return fallback
  }
}

// Loads the data, draws the shared nav / announcement / footer, and picks the page
function App() {
  const [pastors, setPastors] = useState<Pastor[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [cancellations, setCancellations] = useState<Cancellation[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [info, setInfo] = useState<ChurchInfo | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [adminKey, setAdminKey] = useState<string | null>(() => loadAdminKey())

  // Which page: "/admin", "/calendar", or home
  const path = window.location.pathname
  const page = path.startsWith('/admin') ? 'admin' : path.startsWith('/calendar') ? 'calendar' : 'home'

  // Which announcement text this visitor already closed (saved in their browser)
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return localStorage.getItem('dismissedAnnouncement')
    } catch {
      return null
    }
  })

  // ===== Loading data =====

  // Load everything once when the page opens
  useEffect(() => {
    Promise.all([
      getJson<Pastor[]>('/api/pastors', []),
      getJson<Series[]>('/api/series', []),
      getJson<Cancellation[]>('/api/cancellations', []),
      getJson<EventRow[]>('/api/events', []),
      getJson<ChurchInfo | null>('/api/info', null),
    ]).then(([p, s, c, ev, i]) => {
      setPastors(p)
      setSeries(s)
      setCancellations(c)
      setEvents(ev)
      setInfo(i)
      setLoaded(true)
    })
  }, [])

  // Presets are editor-only, so load them only when unlocked
  useEffect(() => {
    if (!adminKey) return
    getJson<Preset[]>('/api/admin/presets', [], { Authorization: `Bearer ${adminKey}` }).then(setPresets)
  }, [adminKey])

  // After data loads, jump to the #section in the URL (e.g. /#pastors)
  useEffect(() => {
    if (!loaded) return
    const id = window.location.hash.slice(1)
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [loaded])

  // Browser tab title
  useEffect(() => {
    if (!info?.i_name) return
    if (page === 'calendar') document.title = `Calendar · ${info.i_name}`
    else if (page === 'admin') document.title = `Admin · ${info.i_name}`
    else document.title = info.i_name
  }, [info, page])

  // Re-fetch after an edit is saved
  function reloadInfo() {
    getJson<ChurchInfo | null>('/api/info', null).then(setInfo)
  }
  function reloadPastors() {
    getJson<Pastor[]>('/api/pastors', []).then(setPastors)
  }
  function reloadSeries() {
    getJson<Series[]>('/api/series', []).then(setSeries)
  }
  function reloadCancellations() {
    getJson<Cancellation[]>('/api/cancellations', []).then(setCancellations)
  }
  function reloadEvents() {
    getJson<EventRow[]>('/api/events', []).then(setEvents)
  }
  function reloadPresets() {
    if (!adminKey) return
    getJson<Preset[]>('/api/admin/presets', [], { Authorization: `Bearer ${adminKey}` }).then(setPresets)
  }

  // ===== Admin =====

  // Save the key on this device, then go to the home page to edit
  function login(key: string) {
    saveAdminKey(key)
    setAdminKey(key)
    window.location.href = '/'
  }

  // Remove the key from this device
  function logout() {
    clearAdminKey()
    setAdminKey(null)
  }

  const admin: Admin | null = adminKey ? { key: adminKey, logout } : null

  // Church info can only be edited once it has loaded
  const canEditInfo = !!admin && !!info

  // Builds the inline editor for a group of church-info fields
  const editInfo: EditInfo = (fields) => (close) =>
    info && admin ? (
      <InfoEditor info={info} fields={fields} admin={admin} onSaved={reloadInfo} onClose={close} />
    ) : null

  // ===== Calendar items =====

  // Everything on a given date: weekly series (minus cancellations) + events
  function getItems(date: Date): CalItem[] {
    const key = toKey(date)

    // Rolling window: series show through the Saturday N weeks after this week
    const lastSeriesDay = addDays(startOfWeek(startOfDay(new Date())), SERIES_WEEKS_AHEAD * 7 + 6)

    const seriesItems: CalItem[] = (date > lastSeriesDay ? [] : series)
      .filter((s) => s.s_day - 1 === date.getDay())
      .map((s) => {
        const c = cancellations.find((c) => c.s_id === s.s_id && c.sc_date === key)
        return {
          id: `s-${s.s_id}-${key}`,
          kind: 'series',
          refId: s.s_id,
          dateKey: key,
          name: s.s_name,
          location: s.s_location,
          description: s.s_description,
          start: s.s_start,
          end: s.s_end,
          cancelled: !!c,
          reason: c?.sc_reason ?? null,
        }
      })

    const eventItems: CalItem[] = events
      .filter((e) => e.e_date === key)
      .map((e) => ({
        id: `e-${e.e_id}`,
        kind: 'event',
        refId: e.e_id,
        dateKey: key,
        name: e.e_name,
        location: e.e_location,
        description: e.e_description,
        start: e.e_start,
        end: e.e_end,
        cancelled: false,
        reason: null,
      }))

    return [...seriesItems, ...eventItems]
      .filter((it) => admin || !it.cancelled) // visitors don't see cancelled dates; editors do (to restore them)
      .sort((a, b) => a.start.localeCompare(b.start))
  }

  // ===== Nav + announcement =====

  // Home link: on the home page, scroll to the top instead of reloading
  function goHome(e: MouseEvent<HTMLAnchorElement>) {
    if (page !== 'home') return
    e.preventDefault()
    history.replaceState(null, '', '/') // clear any #section from the URL
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Visitors see the announcement if there's text and they haven't closed this exact text
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
        <a href="/" className="nav-title" onClick={goHome}>{info?.i_abrv ?? info?.i_name}</a>
        <nav>
          <a href="/" onClick={goHome} className={page === 'home' ? 'active' : ''}>Home</a>
          <a href="/calendar" className={page === 'calendar' ? 'active' : ''}>Calendar</a>
          <a href="/#services">Services</a>
          <a href="/#pastors">Pastors</a>
          <a href="/#about">About</a>
        </nav>
      </header>

      {admin && (
        <div className="admin-bar">
          <span>✏️ Editing mode</span>
          <button type="button" onClick={logout}>Log out</button>
        </div>
      )}

      {/* Announcement: editors always see it (or an Add button); visitors see it unless closed */}
      {canEditInfo ? (
        <Editable
          canEdit
          editor={editInfo(announcementFields)}
          label={announcement ? '✏️ Edit' : '+ Add announcement'}
        >
          {announcement ? (
            <div className="announcement" role="alert">
              <p>{announcement}</p>
            </div>
          ) : (
            <div className="announcement-empty">No announcement right now</div>
          )}
        </Editable>
      ) : (
        showAnnouncement && (
          <div className="announcement" role="alert">
            <p>{announcement}</p>
            <button onClick={dismissAnnouncement} aria-label="Dismiss announcement">×</button>
          </div>
        )
      )}

      {/* ===== The page ===== */}
      {page === 'admin' ? (
        <AdminPage unlocked={!!admin} onLogin={login} onLogout={logout} />
      ) : page === 'calendar' ? (
        <CalendarPage
          getItems={getItems}
          admin={admin}
          events={events}
          series={series}
          presets={presets}
          reloadEvents={reloadEvents}
          reloadCancellations={reloadCancellations}
          reloadPresets={reloadPresets}
        />
      ) : (
        <HomePage
          info={info}
          series={series}
          pastors={pastors}
          presets={presets}
          getItems={getItems}
          admin={admin}
          canEditInfo={canEditInfo}
          editInfo={editInfo}
          reloadPastors={reloadPastors}
          reloadSeries={reloadSeries}
          reloadCancellations={reloadCancellations}
          reloadEvents={reloadEvents}
          reloadPresets={reloadPresets}
        />
      )}

      {/* ===== Footer ===== */}
      <footer>
        <Editable canEdit={canEditInfo} editor={editInfo(contactFields)}>
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
        </Editable>
      </footer>
    </>
  )
}

export default App
