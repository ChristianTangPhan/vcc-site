import { useState } from 'react'
import type { Admin, CalItem, ChurchInfo, EditInfo, GetItems, Pastor, Preset, Series } from '../types'
import { dayNames, formatTimeRange, startOfDay, toKey } from '../lib/dates'
import { finishAdmin, sendAdmin } from '../lib/admin'
import { aboutFields, heroFields } from '../lib/info_fields'
import { Editable } from '../components/editable'
import { DragList } from '../components/drag_list'
import { CalCard } from '../components/cal_card'
import { SeriesEditor } from '../editors/series_editor'
import { PastorEditor } from '../editors/pastor_editor'
import { EventEditor } from '../editors/event_editor'

export function HomePage({
  info,
  series,
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
  const [addingSeries, setAddingSeries] = useState(false)
  const [addingPastor, setAddingPastor] = useState(false)
  const [addingEvent, setAddingEvent] = useState(false)

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
                <CalCard item={it} />
                {admin && (
                  <button
                    type="button"
                    className={`quick-btn ${restoring ? 'restore' : ''}`}
                    onClick={() => quickRemove(it)}
                    aria-label={label}
                    title={label}
                  >
                    {restoring ? '↺' : '−'}
                  </button>
                )}
              </div>
            )
          })
        )}

        {admin &&
          (addingEvent ? (
            <EventEditor
              initialDate={toKey(new Date())}
              series={series}
              presets={presets}
              admin={admin}
              onSaved={() => { reloadEvents(); reloadCancellations() }}
              onPresetsChanged={reloadPresets}
              onClose={() => setAddingEvent(false)}
            />
          ) : (
            <button type="button" className="add-btn" onClick={() => setAddingEvent(true)}>
              + Add event today
            </button>
          ))}

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
              <Editable
                className="drag-body"
                canEdit={!!admin}
                editor={(close) =>
                  admin && <SeriesEditor series={s} admin={admin} onSaved={reloadSeries} onClose={close} />
                }
              >
                <div className={`card ${s.s_show_on_home ? '' : 'hidden-series'}`}>
                  <h3>{s.s_name}</h3>
                  <p>{[dayNames[s.s_day - 1], formatTimeRange(s.s_start, s.s_end)].filter(Boolean).join(' · ')}</p>
                  <p className="muted">{s.s_location}</p>
                  {s.s_description && <p>{s.s_description}</p>}
                  {!s.s_show_on_home && <p className="hidden-tag">Not shown on home (calendar only)</p>}
                </div>
              </Editable>
            </>
          )}
        />

        {admin &&
          (addingSeries ? (
            <SeriesEditor admin={admin} onSaved={reloadSeries} onClose={() => setAddingSeries(false)} />
          ) : (
            <button type="button" className="add-btn" onClick={() => setAddingSeries(true)}>
              + Add weekly series
            </button>
          ))}
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
    </>
  )
}
