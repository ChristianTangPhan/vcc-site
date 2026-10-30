// Week/month calendar grid with ‹ Today › navigation
import { useState } from 'react'
import type { CalItem, GetItems, View } from '../types'
import { addDays, dayNames, getViewDays, getViewTitle, shortDayNames, startOfDay, toKey } from '../lib/dates'
import { CalCard } from './cal_card'

export function Calendar({
  getItems,
  onCardClick,
  onAdd,
}: {
  getItems: GetItems
  onCardClick: (item: CalItem) => void
  onAdd?: (date: Date) => void // editors only: "+" in each day
}) {
  const [view, setView] = useState<View>('week')
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const days = getViewDays(anchor, view)

  // ‹ / › : previous / next week or month
  function move(dir: 1 | -1) {
    setAnchor((a) => (view === 'week' ? addDays(a, 7 * dir) : new Date(a.getFullYear(), a.getMonth() + dir, 1)))
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
          <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button>
          <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
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
            onCardClick={onCardClick}
            onAdd={onAdd}
          />
        ))}
      </div>
    </>
  )
}

// One day box
function DayCell({
  date,
  items,
  view,
  outside,
  onCardClick,
  onAdd,
}: {
  date: Date
  items: CalItem[]
  view: View
  outside: boolean // month view: day from the month before/after
  onCardClick: (item: CalItem) => void
  onAdd?: (date: Date) => void
}) {
  const isToday = toKey(date) === toKey(new Date())
  const label = view === 'week' ? `${dayNames[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}` : date.getDate()

  return (
    <div className={`day ${isToday ? 'today' : ''} ${outside ? 'outside' : ''} ${items.length === 0 ? 'empty' : ''}`}>
      <div className="day-header">{label}</div>
      {onAdd && <button type="button" className="day-add" onClick={() => onAdd(date)} aria-label="Add">+</button>}
      {view === 'week' && items.length === 0 && <p className="muted day-empty">No events</p>}
      {items.map((it) => (
        <CalCard key={it.id} item={it} compact={view === 'month'} onClick={() => onCardClick(it)} />
      ))}
    </div>
  )
}
