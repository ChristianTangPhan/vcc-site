// Home page "Service Times": weekly series marked "show on home".
// Editors see all of them (hidden ones dimmed), can drag ☰ to reorder, and edit or add.
import type { Admin, CalItem, EditTarget, Site } from '../types'
import { dayNames, formatTimeRange } from '../lib/dates'
import { seriesItem } from '../lib/calendar_items'
import { DragList } from '../components/drag_list'
import { LocationLine } from '../components/location_line'

export function ServiceTimesSection({
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
  const listed = admin ? site.series : site.series.filter((s) => s.s_show_on_home)

  return (
    <section id="services">
      <h2>Service Times</h2>
      {admin && (
        <p className="muted small-note">
          Editors see every weekly series here. Dimmed ones are hidden from visitors. Drag ☰ to change the order.
        </p>
      )}

      <DragList
        items={listed}
        getKey={(s) => s.s_id}
        enabled={!!admin}
        onReorder={site.saveSeriesOrder}
        renderItem={(s, handle) => {
          // Tapping a card: editors edit, visitors see details
          const open = () => (admin ? onEdit({ kind: 'series', series: s }) : onDetails(`Every ${dayNames[s.s_day - 1]}`, seriesItem(s)))
          return (
            <>
              {handle}
              <div className="drag-body series-card-wrap">
                <div
                  className={`card clickable ${s.s_show_on_home ? '' : 'hidden-series'}`}
                  onClick={open}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') open() }}
                >
                  <h3>{s.s_name}</h3>
                  <p>{[dayNames[s.s_day - 1], formatTimeRange(s.s_start, s.s_end)].filter(Boolean).join(' · ')}</p>
                  {s.s_location && (
                    <p className="muted"><LocationLine text={s.s_location} isAddress={s.s_location_is_address} showCopy={false} /></p>
                  )}
                  {s.s_description && <p>{s.s_description}</p>}
                  {!s.s_show_on_home && <p className="hidden-tag">Not shown on home (calendar only)</p>}
                </div>
                {admin && (
                  <button type="button" className="edit-btn" onClick={() => onEdit({ kind: 'series', series: s })}>
                    ✏️ Edit
                  </button>
                )}
              </div>
            </>
          )
        }}
      />

      {admin && (
        <button type="button" className="add-btn" onClick={() => onEdit({ kind: 'new', repeats: true })}>
          + Add weekly series
        </button>
      )}
    </section>
  )
}
