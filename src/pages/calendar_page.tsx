// Calendar page: week/month grid. Visitors tap for details; editors add, edit, and manage presets.
import { useState } from 'react'
import type { Admin, CalItem, EditTarget, Site } from '../types'
import { formatDateKey, toKey } from '../lib/dates'
import { Calendar } from '../components/calendar'
import { CalCard } from '../components/cal_card'
import { Modal } from '../components/modal'
import { ItemEditor } from '../editors/item_editor'
import { PresetManager } from '../editors/preset_manager'

// What's open in the popup
type Popup =
  | { kind: 'details'; item: CalItem }   // visitor looking at a card
  | { kind: 'edit'; target: EditTarget } // editor adding/editing
  | { kind: 'presets' }                  // editor managing presets

export function CalendarPage({ site, admin }: { site: Site; admin: Admin | null }) {
  const [popup, setPopup] = useState<Popup | null>(null)
  const close = () => setPopup(null)

  // Tapping a card: visitors see details, editors get the editor
  function open(it: CalItem) {
    if (!admin) return setPopup({ kind: 'details', item: it })
    if (it.kind === 'event') {
      const event = site.events.find((e) => e.e_id === it.refId)
      if (event) setPopup({ kind: 'edit', target: { kind: 'event', event } })
    } else {
      const series = site.series.find((s) => s.s_id === it.refId)
      if (series) {
        const occurrence = { dateKey: it.dateKey, cancelled: it.cancelled, reason: it.reason }
        setPopup({ kind: 'edit', target: { kind: 'series', series, occurrence } })
      }
    }
  }

  const addOn = (date: Date) => setPopup({ kind: 'edit', target: { kind: 'new', dateKey: toKey(date) } })

  return (
    <section id="calendar">
      <div className="calendar-header">
        <h2>Calendar</h2>
        {admin && (
          <div className="calendar-header-actions">
            <button type="button" className="add-btn secondary-add" onClick={() => setPopup({ kind: 'presets' })}>
              Manage presets
            </button>
            <button type="button" className="add-btn" onClick={() => addOn(new Date())}>
              + Add
            </button>
          </div>
        )}
      </div>

      <Calendar getItems={site.getItems} onCardClick={open} onAdd={admin ? addOn : undefined} />

      {popup && (
        <Modal onClose={close}>
          {popup.kind === 'details' && (
            <>
              <p className="muted modal-date">{formatDateKey(popup.item.dateKey)}</p>
              <CalCard item={popup.item} detailed />
            </>
          )}
          {popup.kind === 'presets' && admin && (
            <PresetManager presets={site.presets} admin={admin} onChanged={site.reload.presets} />
          )}
          {popup.kind === 'edit' && admin && (
            <ItemEditor target={popup.target} site={site} admin={admin} onClose={close} />
          )}
        </Modal>
      )}
    </section>
  )
}
