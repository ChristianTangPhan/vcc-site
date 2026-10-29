import type { CalItem } from '../types'
import { formatTime } from '../lib/dates'

// One service/event card (used on Today and the calendar)
export function CalCard({
  item,
  compact,
  detailed,
  onClick,
}: {
  item: CalItem
  compact?: boolean   // month view: name only
  detailed?: boolean  // popup: also show the description
  onClick?: () => void
}) {
  return (
    <div
      className={`cal-card ${item.kind} ${item.cancelled ? 'cancelled' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
    >
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
      {detailed && item.description && <div className="cal-description">{item.description}</div>}
    </div>
  )
}
