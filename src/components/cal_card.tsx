// One series/event card (Today, the calendar, and popups)
import type { CalItem } from '../types'
import { formatTimeRange } from '../lib/dates'
import { LocationLine } from './location_line'

export function CalCard({
  item,
  compact,
  detailed,
  onClick,
}: {
  item: CalItem
  compact?: boolean  // month view: name only
  detailed?: boolean // popup: description + copy button
  onClick?: () => void
}) {
  const time = formatTimeRange(item.start, item.end)

  return (
    <div
      className={`cal-card ${item.kind} ${item.cancelled ? 'cancelled' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
    >
      <div className="cal-name">{item.name}</div>
      {!compact && item.location && (
        <div className="cal-location">
          <LocationLine text={item.location} isAddress={item.locationIsAddress} showCopy={!!detailed} />
        </div>
      )}
      {!compact && time && <div className="cal-time">{time}</div>}
      {!compact && item.cancelled && <div className="cal-cancelled">Cancelled{item.reason ? `: ${item.reason}` : ''}</div>}
      {detailed && item.description && <div className="cal-description">{item.description}</div>}
    </div>
  )
}
