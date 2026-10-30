// Turns weekly series + one-time events into the cards shown on a given date
import type { CalItem, Cancellation, EventRow, Series } from '../types'
import { addDays, startOfDay, startOfWeek, toKey } from './dates'

// How many weeks ahead weekly series show on the calendar (slides forward every Sunday)
export const SERIES_WEEKS_AHEAD = 4

// One weekly series as a card (dateKey '' = not tied to a date, e.g. in Service Times)
export function seriesItem(s: Series, dateKey = '', cancellation?: Cancellation): CalItem {
  return {
    id: `s-${s.s_id}-${dateKey}`,
    kind: 'series',
    refId: s.s_id,
    dateKey,
    name: s.s_name,
    location: s.s_location,
    locationIsAddress: !!s.s_location_is_address,
    description: s.s_description,
    start: s.s_start,
    end: s.s_end,
    cancelled: !!cancellation,
    reason: cancellation?.sc_reason ?? null,
  }
}

// One event as a card
export function eventItem(e: EventRow): CalItem {
  return {
    id: `e-${e.e_id}`,
    kind: 'event',
    refId: e.e_id,
    dateKey: e.e_date,
    name: e.e_name,
    location: e.e_location,
    locationIsAddress: !!e.e_location_is_address,
    description: e.e_description,
    start: e.e_start,
    end: e.e_end,
    cancelled: false,
    reason: null,
  }
}

// Everything on a date, sorted: untimed first, then by start (or end, if only an end time).
// Cancelled series dates are hidden unless showCancelled (editors see them, to restore).
export function itemsOn(
  date: Date,
  data: { series: Series[]; events: EventRow[]; cancellations: Cancellation[] },
  showCancelled: boolean,
): CalItem[] {
  const key = toKey(date)
  const lastSeriesDay = addDays(startOfWeek(startOfDay(new Date())), SERIES_WEEKS_AHEAD * 7 + 6)

  const seriesItems = (date > lastSeriesDay ? [] : data.series)
    .filter((s) => s.s_day - 1 === date.getDay())
    .map((s) => seriesItem(s, key, data.cancellations.find((c) => c.s_id === s.s_id && c.sc_date === key)))

  const eventItems = data.events.filter((e) => e.e_date === key).map(eventItem)

  return [...seriesItems, ...eventItems]
    .filter((it) => showCancelled || !it.cancelled)
    .sort((a, b) => (a.start ?? a.end ?? '').localeCompare(b.start ?? b.end ?? ''))
}
