// Shapes of the data. Database rows match the SQL functions (bigint ids arrive as strings).
import type { ReactNode } from 'react'

// ===== Database rows =====

export type ChurchInfo = {
  i_name: string | null
  i_abrv: string | null
  i_tagline: string | null
  i_about: string | null
  i_address: string | null
  i_phone: string | null
  i_email: string | null
  i_facebook: string | null
  i_youtube: string | null
  i_announcement: string | null
}

export type Pastor = {
  p_id: string
  p_name: string
  p_phone_number: string
  p_email: string
  p_image: string | null
}

// A weekly repeating thing: services, worship practice, prayer…
export type Series = {
  s_id: string
  s_name: string
  s_description: string | null
  s_location: string
  s_location_is_address: boolean // show a map link
  s_day: number                  // 1 = Sunday … 7 = Saturday
  s_start: string | null         // null = no start time
  s_end: string | null           // null = no end time
  s_show_on_home: boolean        // listed under "Service Times" on the home page
}

// One skipped date of a weekly series
export type Cancellation = {
  sc_id: string
  s_id: string
  sc_date: string // "2026-11-01"
  sc_reason: string | null
}

// A one-time event ("EventRow" because "Event" is already a built-in browser type)
export type EventRow = {
  e_id: string
  e_name: string
  e_description: string | null
  e_location: string | null
  e_location_is_address: boolean
  e_date: string // "2026-11-12"
  e_start: string | null
  e_end: string | null
}

// A saved event template
export type Preset = {
  ep_id: string
  ep_label: string
  ep_name: string | null
  ep_description: string | null
  ep_location: string | null
  ep_location_is_address: boolean
  ep_start: string | null
  ep_end: string | null
}

// ===== Calendar =====

// One card on Today / the calendar: a weekly series on a date, or an event
export type CalItem = {
  id: string
  kind: 'series' | 'event'
  refId: string   // s_id or e_id
  dateKey: string // "2026-11-12" ('' = not tied to a date)
  name: string
  location: string | null
  locationIsAddress: boolean
  description: string | null
  start: string | null
  end: string | null
  cancelled: boolean
  reason: string | null
}

export type View = 'week' | 'month'
export type GetItems = (date: Date) => CalItem[]

// What the event/series editor is opened on
export type EditTarget =
  | { kind: 'event'; event: EventRow }
  | { kind: 'series'; series: Series; occurrence?: { dateKey: string; cancelled: boolean; reason: string | null } }
  | { kind: 'new'; dateKey?: string; repeats?: boolean }

// ===== Site data (from useSite) =====

export type LoadStatus = 'loading' | 'ready' | 'error'

export type Site = {
  info: ChurchInfo | null
  pastors: Pastor[]
  series: Series[]
  events: EventRow[]
  cancellations: Cancellation[]
  presets: Preset[]   // editors only
  loaded: boolean     // true once the first load finishes
  status: LoadStatus
  getItems: GetItems
  refresh: () => void // ↻ button / "Try again"
  reload: {
    info: () => void
    pastors: () => void
    calendar: () => void // series + events + cancellations
    presets: () => void
  }
  saveSeriesOrder: (newOrder: Series[]) => void
}

// ===== Editing =====

// Logged-in editor: their key + how to log them out
export type Admin = { key: string; logout: () => void }

// One field in a church-info editor
export type InfoField = { key: keyof ChurchInfo; label: string; multiline?: boolean }

// Given which fields to edit, returns the editor form
export type EditInfo = (fields: InfoField[]) => (close: () => void) => ReactNode
