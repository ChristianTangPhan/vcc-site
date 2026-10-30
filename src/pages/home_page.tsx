import { useState } from 'react'
import type { Admin, CalItem, ChurchInfo, EditInfo, EventRow, GetItems, Pastor, Preset, Series } from '../types'
import { dayNames, formatTimeRange, startOfDay, toKey } from '../lib/dates'
import { finishAdmin, sendAdmin } from '../lib/admin'
import { aboutFields, heroFields } from '../lib/info_fields'
import { Editable } from '../components/editable'
import { DragList } from '../components/drag_list'
import { CalCard } from '../components/cal_card'
import { Modal } from '../components/modal'
import { LocationLine } from '../components/copy_button'
import { PastorEditor } from '../editors/pastor_editor'
import { ItemEditor, type EditTarget } from '../editors/item_editor'

export function HomePage({
  info,
  series,
  events,
  pastors,
  presets,
  getItems,
  admin,
  canEditInfo,
  editInfo,
  reloadPastors,
  reloadSeries,
  reorderSeries,
  reloadCancellations,
  reloadEvents,
  reloadPresets,
  loading,
}: {
  info: ChurchInfo | null
  series: Series[]
  events: EventRow[]
  pastors: Pastor[]
  presets: Preset[]
  getItems: GetItems
  admin: Admin | null
  canEditInfo: boolean
  editInfo: EditInfo
  reloadPastors: () => void
  reloadSeries: () => void
  reorderSeries: (newOrder: Series[]) => void
  reloadCancellations: () => void
  reloadEvents: () => void
  reloadPresets: () => void
  loading: boolean
}) {
  const todayItems = getItems(startOfDay(new Date()))
  const [addingPastor, setAddingPastor] = useState(false)

  // Event / series open in the editor popup
  const [editing, setEditing] = useState<EditTarget | null>(null)

  function reloadAll() {
    reloadEvents()
    reloadSeries()
    reloadCancellations()
  }

  // Editor for a Today card: events edit as-is; series also get "this date only" options
  function editItem(it: CalItem) {
    if (it.kind === 'event') {
      const ev = events.find((e) => e.e_id === it.refId)
      if (ev) setEditing({ kind: 'event', event: ev })
    } else {
      const s = series.find((x) => x.s_id === it.refId)
      if (s) setEditing({ kind: 'series', series: s, occurrence: { dateKey: it.dateKey, cancelled: it.cancelled, reason: it.reason } })
    }
  }

  // Details popup: heading line (date or "Every Sunday") + the card
  const [details, setDetails] = useState<{ heading: string; item: CalItem } | null>(null)

  // Tapping a Today card: editors get the editor, visitors get the details
  function openToday(it: CalItem) {
    if (admin) return editItem(it)
    setDetails({ heading: 'Today', item: it })
  }

  // Tapping a Service Times card: editors edit it, visitors see the details
  function openSeries(s: Series) {
    if (admin) return setEditing({ kind: 'series', series: s })
    setDetails({
      heading: `Every ${dayNames[s.s_day - 1]}`,
      item: {
        id: `s-${s.s_id}`,
        kind: 'series',
        refId: s.s_id,
        dateKey: '',
        name: s.s_name,
        location: s.s_location,
        locationIsAddress: !!s.s_location_is_address,
        description: s.s_description,
        start: s.s_start,
        end: s.s_end,
        cancelled: false,
        reason: null,
      },
    })
  }

  // Visitors only see series marked "show on home"; editors see all (to edit the hidden ones)
  const listedSeries = admin ? series : series.filter((s) => s.s_show_on_home)

  // − on a Today card: cancel/restore a series date, or delete an event
  async function quickRemove(it: CalItem) {
    if (!admin) return

    if (it.kind === 'series') {
      const res = it.cancelled
        ? await sendAdmin(admin, `/api/admin/cancellations?s_id=${it.refId}&date=${it.dateKey}`, 'DELETE')
        : await sendAdmin(admin, '/api/admin/cancellations', 'POST', {
            s_id: it.refId,
            sc_date: it.dateKey,
            sc_reason: '',
          })
      await finishAdmin(res, admin, reloadCancellations, alert)
    } else {
      if (!confirm(`Delete "${it.name}"? This can't be undone.`)) return
      const res = await sendAdmin(admin, `/api/admin/events?id=${it.refId}`, 'DELETE')
      await finishAdmin(res, admin, reloadEvents, alert)
    }
  }

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="hero">
        <Editable canEdit={canEditInfo} editor={editInfo(heroFields)}>
          <h1>{info?.i_name}</h1>
          <p>{info?.i_tagline}</p>
        </Editable>
      </section>

      {/* ===== Today ===== */}
      <section id="today">
        <h2>
          Today ·{' '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        {todayItems.length === 0 ? (
          <p className="muted">{loading ? 'Loading…' : 'No events today.'}</p>
        ) : (
          todayItems.map((it) => {
            const restoring = it.kind === 'series' && it.cancelled
            const label = restoring ? 'Restore' : it.kind === 'series' ? 'Cancel today' : 'Delete event'
            return (
              <div className="today-item" key={it.id}>
                <CalCard item={it} onClick={() => openToday(it)} />
                {admin && (
                  <div className="today-actions two">
                    <button
                      type="button"
                      className="quick-btn edit"
                      onClick={() => editItem(it)}
                      aria-label={it.kind === 'event' ? 'Edit event' : 'Edit weekly series'}
                      title={it.kind === 'event' ? 'Edit event' : 'Edit weekly series (every week)'}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className={`quick-btn ${restoring ? 'restore' : ''}`}
                      onClick={() => quickRemove(it)}
                      aria-label={label}
                      title={label}
                    >
                      {restoring ? '↺' : '−'}
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}

        {admin && (
          <button type="button" className="add-btn" onClick={() => setEditing({ kind: 'new', dateKey: toKey(new Date()) })}>
            + Add event today
          </button>
        )}

        <a href="/calendar" className="section-link today-link">View full calendar →</a>
      </section>

      {/* ===== Service Times (series marked "show on home") ===== */}
      <section id="services">
        <h2>Service Times</h2>
        {admin && (
          <p className="muted small-note">
            Editors see every weekly series here. Dimmed ones are hidden from visitors. Drag ☰ to change the order.
          </p>
        )}
        <DragList
          items={listedSeries}
          getKey={(s) => s.s_id}
          enabled={!!admin}
          onReorder={reorderSeries}
          renderItem={(s, handle) => (
            <>
              {handle}
              <div className="drag-body series-card-wrap">
                <div
                  className={`card clickable-card ${s.s_show_on_home ? '' : 'hidden-series'}`}
                  onClick={() => openSeries(s)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') openSeries(s) }}
                >
                  <h3>{s.s_name}</h3>
                  <p>{[dayNames[s.s_day - 1], formatTimeRange(s.s_start, s.s_end)].filter(Boolean).join(' · ')}</p>
                  {s.s_location && <p className="muted"><LocationLine text={s.s_location} isAddress={s.s_location_is_address} showCopy={false} /></p>}
                  {s.s_description && <p>{s.s_description}</p>}
                  {!s.s_show_on_home && <p className="hidden-tag">Not shown on home (calendar only)</p>}
                </div>
                {admin && (
                  <button type="button" className="edit-btn" onClick={() => setEditing({ kind: 'series', series: s })}>
                    ✏️ Edit
                  </button>
                )}
              </div>
            </>
          )}
        />

        {admin && (
          <button type="button" className="add-btn" onClick={() => setEditing({ kind: 'new', repeats: true })}>
            + Add weekly series
          </button>
        )}
      </section>

      {/* ===== Pastors ===== */}
      <section id="pastors">
        <h2>Our Pastors</h2>
        <div className={`pastor-row ${pastors.length === 1 ? 'single' : ''}`}>
          {pastors.map((p) => (
            <Editable
              key={p.p_id}
              className="pastor-slot"
              canEdit={!!admin}
              editor={(close) =>
                admin && <PastorEditor pastor={p} admin={admin} onSaved={reloadPastors} onClose={close} />
              }
            >
              <div className="card pastor-card">
                {p.p_image && <img className="pastor-photo" src={p.p_image} alt={p.p_name} />}
                <h3>{p.p_name}</h3>
                <p><a href={`tel:${p.p_phone_number}`}>{p.p_phone_number}</a></p>
                <p><a href={`mailto:${p.p_email}`}>{p.p_email}</a></p>
              </div>
            </Editable>
          ))}
        </div>
        {pastors.length > 1 && <p className="muted swipe-hint">Swipe to see more →</p>}

        {admin &&
          (addingPastor ? (
            <PastorEditor admin={admin} onSaved={reloadPastors} onClose={() => setAddingPastor(false)} />
          ) : (
            <button type="button" className="add-btn" onClick={() => setAddingPastor(true)}>
              + Add pastor
            </button>
          ))}
      </section>

      {/* ===== About ===== */}
      <section id="about">
        <Editable canEdit={canEditInfo} editor={editInfo(aboutFields)}>
          <h2>About Us</h2>
          <p className="about-text">{info?.i_about}</p>
        </Editable>
      </section>

      {editing && admin && (
        <Modal onClose={() => setEditing(null)}>
          <ItemEditor
            target={editing}
            series={series}
            presets={presets}
            admin={admin}
            onSaved={reloadAll}
            onPresetsChanged={reloadPresets}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}

      {details && (
        <Modal onClose={() => setDetails(null)}>
          <p className="muted modal-date">{details.heading}</p>
          <CalCard item={details.item} detailed />
        </Modal>
      )}
    </>
  )
}
