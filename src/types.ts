import type { ReactNode } from 'react'

// Postgres bigint IDs arrive as strings in JSON

export type Pastor = {
  p_id: string
  p_name: string
  p_phone_number: string
  p_email: string
  p_image: string | null
}

export type Service = {
  s_id: string
  s_name: string
  s_description: string | null
  s_location: string
  s_day: number // 1 = Sunday ... 7 = Saturday
  s_start: string
  s_end: string
}

export type Cancellation = {
  sc_id: string
  s_id: string
  sc_date: string // "2026-11-01"
  sc_reason: string | null
}

// "EventRow" because "Event" is already a built-in browser type
export type EventRow = {
  e_id: string
  e_name: string
  e_description: string | null
  e_location: string | null
  e_date: string // "2026-11-12"
  e_start: string
  e_end: string
}

export type Preset = {
  ep_id: string
  ep_label: string
  ep_name: string | null
  ep_description: string | null
  ep_location: string | null
  ep_start: string | null
  ep_end: string | null
}

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

// One card on the calendar (a service on a date, or an event)
export type CalItem = {
  id: string
  kind: 'service' | 'event'
  refId: string   // s_id or e_id
  dateKey: string // "2026-11-12"
  name: string
  location: string | null
  description: string | null
  start: string
  end: string
  cancelled: boolean
  reason: string | null
}

export type View = 'week' | 'month'
export type GetItems = (d: Date) => CalItem[]

// Logged-in editor: their key + how to log them out
export type Admin = { key: string; logout: () => void }

// One editable field in a church-info editor
export type InfoField = { key: keyof ChurchInfo; label: string; multiline?: boolean }

// Given which fields to edit, returns the editor form
export type EditInfo = (fields: InfoField[]) => (close: () => void) => ReactNode
