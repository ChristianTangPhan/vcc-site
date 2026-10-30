// Home page "Today": today's series + events. Editors get ✏️ / − (↺ restores) and "+ Add event today".
import type { Admin, CalItem, EditTarget, Site } from '../types'
import { finishAdmin, sendAdmin } from '../lib/api'
import { formatToday, startOfDay, toKey } from '../lib/dates'
import { CalCard } from '../components/cal_card'

export function TodaySection({
  site,
  admin,
  onEdit,
  onDetails,
}: {
  site: Site
  admin: Admin | null
  onEdit: (target: EditTarget) => void
  onDetails: (heading: string, item: CalItem) => void
}) {
  const items = site.getItems(startOfDay(new Date()))

  // Editor for one card: events as-is; series also get "this date only" options
  function edit(it: CalItem) {
    if (it.kind === 'event') {
      const event = site.events.find((e) => e.e_id === it.refId)
      if (event) onEdit({ kind: 'event', event })
    } else {
      const series = site.series.find((s) => s.s_id === it.refId)
      if (series) onEdit({ kind: 'series', series, occurrence: { dateKey: it.dateKey, cancelled: it.cancelled, reason: it.reason } })
    }
  }

  // Tapping a card: editors edit, visitors see details
  function open(it: CalItem) {
    if (admin) edit(it)
    else onDetails('Today', it)
  }

  // − : skip a series today (↺ restores it), or delete an event
  async function quickRemove(it: CalItem) {
    if (!admin) return
    if (it.kind === 'series') {
      const res = it.cancelled
        ? await sendAdmin(admin, `/api/admin/cancellations?s_id=${it.refId}&date=${it.dateKey}`, 'DELETE')
        : await sendAdmin(admin, '/api/admin/cancellations', 'POST', { s_id: it.refId, sc_date: it.dateKey, sc_reason: '' })
      await finishAdmin(res, admin, site.reload.calendar, alert)
    } else {
      if (!confirm(`Delete "${it.name}"? This can't be undone.`)) return
      const res = await sendAdmin(admin, `/api/admin/events?id=${it.refId}`, 'DELETE')
      await finishAdmin(res, admin, site.reload.calendar, alert)
    }
  }

  return (
    <section id="today">
      <h2>Today · {formatToday()}</h2>

      {items.length === 0 && <p className="muted">{site.loaded ? 'No events today.' : 'Loading…'}</p>}

      {items.map((it) => {
        const restoring = it.kind === 'series' && it.cancelled
        const removeLabel = restoring ? 'Restore' : it.kind === 'series' ? 'Cancel today' : 'Delete event'
        const editLabel = it.kind === 'series' ? 'Edit weekly series' : 'Edit event'
        return (
          <div className="today-item" key={it.id}>
            <CalCard item={it} onClick={() => open(it)} />
            {admin && (
              <div className="today-actions">
                <button type="button" className="quick-btn edit" onClick={() => edit(it)} aria-label={editLabel} title={editLabel}>
                  ✏️
                </button>
                <button
                  type="button"
                  className={`quick-btn ${restoring ? 'restore' : ''}`}
                  onClick={() => quickRemove(it)}
                  aria-label={removeLabel}
                  title={removeLabel}
                >
                  {restoring ? '↺' : '−'}
                </button>
              </div>
            )}
          </div>
        )
      })}

      {admin && (
        <button type="button" className="add-btn" onClick={() => onEdit({ kind: 'new', dateKey: toKey(new Date()) })}>
          + Add event today
        </button>
      )}

      <a href="/calendar" className="section-link today-link">View full calendar →</a>
    </section>
  )
}
