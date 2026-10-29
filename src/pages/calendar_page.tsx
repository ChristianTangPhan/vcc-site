import { useState } from 'react'
import type { Admin, CalItem, EventRow, GetItems, Preset, Series } from '../types'
import { formatDateKey, toKey } from '../lib/dates'
import { Calendar } from '../components/calendar'
import { CalCard } from '../components/cal_card'
import { Modal } from '../components/modal'
import { EventEditor } from '../editors/event_editor'
import { OccurrenceEditor } from '../editors/occurrence_editor'
import { PresetManager } from '../editors/preset_manager'

// What's open in the popup
type Selection =
  | { kind: 'view'; item: CalItem }      // visitor looking at details
  | { kind: 'new'; dateKey: string }     // editor adding an event
  | { kind: 'event'; event: EventRow }   // editor editing an event
  | { kind: 'series'; item: CalItem }    // editor cancelling/restoring a series date
  | { kind: 'presets' }                  // editor managing presets

export function CalendarPage({
  getItems,
  admin,
  events,
  series,
  presets,
  reloadEvents,
  reloadCancellations,
  reloadPresets,
}: {
  getItems: GetItems
  admin: Admin | null
  events: EventRow[]
  series: Series[]
  presets: Preset[]
  reloadEvents: () => void
  reloadCancellations: () => void
  reloadPresets: () => void
}) {
  const [selected, setSelected] = useState<Selection | null>(null)
  const close = () => setSelected(null)

  // Tapping a card: visitors see details, editors get the right editor
  function openItem(it: CalItem) {
    if (!admin) return setSelected({ kind: 'view', item: it })
    if (it.kind === 'series') return setSelected({ kind: 'series', item: it })
    const ev = events.find((e) => e.e_id === it.refId)
    if (ev) setSelected({ kind: 'event', event: ev })
  }

  function addOn(d: Date) {
    setSelected({ kind: 'new', dateKey: toKey(d) })
  }

  return (
    <section id="calendar">
      <div className="calendar-header">
        <h2>Calendar</h2>
        {admin && (
          <div className="calendar-header-actions">
            <button type="button" className="add-btn secondary-add" onClick={() => setSelected({ kind: 'presets' })}>
              Manage presets
            </button>
            <button type="button" className="add-btn" onClick={() => addOn(new Date())}>
              + Add event
            </button>
          </div>
        )}
      </div>

      <Calendar getItems={getItems} onCardClick={openItem} onAdd={admin ? addOn : undefined} />

      {selected && (
        <Modal onClose={close}>
          {selected.kind === 'view' ? (
            <>
              <p className="muted modal-date">{formatDateKey(selected.item.dateKey)}</p>
              <CalCard item={selected.item} detailed />
            </>
          ) : !admin ? null : selected.kind === 'presets' ? (
            <PresetManager presets={presets} admin={admin} onChanged={reloadPresets} />
          ) : selected.kind === 'series' ? (
            <OccurrenceEditor item={selected.item} admin={admin} onSaved={reloadCancellations} onClose={close} />
          ) : (
            <EventEditor
              event={selected.kind === 'event' ? selected.event : undefined}
              initialDate={selected.kind === 'new' ? selected.dateKey : undefined}
              series={series}
              presets={presets}
              admin={admin}
              onSaved={() => { reloadEvents(); reloadCancellations() }}
              onPresetsChanged={reloadPresets}
              onClose={close}
            />
          )}
        </Modal>
      )}
    </section>
  )
}
