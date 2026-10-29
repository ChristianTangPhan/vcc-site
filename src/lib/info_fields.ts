import type { InfoField } from '../types'

// Which church-info fields each ✏️ button edits

export const announcementFields: InfoField[] = [
  { key: 'i_announcement', label: 'Announcement (leave empty to hide the yellow banner)', multiline: true },
]

export const heroFields: InfoField[] = [
  { key: 'i_name', label: 'Church name' },
  { key: 'i_abrv', label: 'Short name (nav bar)' },
  { key: 'i_tagline', label: 'Tagline (under the welcome)' },
]

export const aboutFields: InfoField[] = [
  { key: 'i_about', label: 'About us', multiline: true },
]

export const contactFields: InfoField[] = [
  { key: 'i_address', label: 'Address' },
  { key: 'i_phone', label: 'Phone' },
  { key: 'i_email', label: 'Email' },
  { key: 'i_facebook', label: 'Facebook link' },
  { key: 'i_youtube', label: 'YouTube link' },
]
