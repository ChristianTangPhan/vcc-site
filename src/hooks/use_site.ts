// Loads and reloads everything the site shows
import { useEffect, useState } from 'react'
import type { Admin, Cancellation, ChurchInfo, EventRow, LoadStatus, Pastor, Preset, Series, Site } from '../types'
import { getJson, sendAdmin } from '../lib/api'
import { itemsOn } from '../lib/calendar_items'

type SiteData = {
  info: ChurchInfo | null
  pastors: Pastor[]
  series: Series[]
  events: EventRow[]
  cancellations: Cancellation[]
}

const EMPTY: SiteData = { info: null, pastors: [], series: [], events: [], cancellations: [] }

// Fetch all public data at once; `failed` = at least one request failed
async function fetchAll(): Promise<{ data: SiteData; failed: boolean }> {
  let failed = false
  const onFail = () => { failed = true }

  const [info, pastors, series, events, cancellations] = await Promise.all([
    getJson<ChurchInfo | null>('/api/info', null, { onFail }),
    getJson<Pastor[]>('/api/pastors', [], { onFail }),
    getJson<Series[]>('/api/series', [], { onFail }),
    getJson<EventRow[]>('/api/events', [], { onFail }),
    getJson<Cancellation[]>('/api/cancellations', [], { onFail }),
  ])
  return { data: { info, pastors, series, events, cancellations }, failed }
}

export function useSite(admin: Admin | null): Site {
  const [data, setData] = useState<SiteData>(EMPTY)
  const [presets, setPresets] = useState<Preset[]>([])
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const adminKey = admin?.key ?? null

  // ===== Loading =====

  // First load when the page opens
  useEffect(() => {
    fetchAll().then(({ data: next, failed }) => {
      setData(next)
      setLoaded(true)
      setStatus(failed ? 'error' : 'ready')
    })
  }, [])

  // Presets are editor-only, so load them once unlocked
  useEffect(() => {
    if (!adminKey) return
    getJson<Preset[]>('/api/admin/presets', [], { key: adminKey }).then(setPresets)
  }, [adminKey])

  // ↻ / "Try again": reload everything; if it fails, keep what's on screen
  function refresh() {
    setStatus('loading')
    fetchAll().then(({ data: next, failed }) => {
      if (!failed) setData(next)
      setStatus(failed ? 'error' : 'ready')
    })
    reload.presets()
  }

  // ===== Reloading one part after an edit =====

  const reload = {
    info() {
      getJson<ChurchInfo | null>('/api/info', null).then((info) => setData((d) => ({ ...d, info })))
    },
    pastors() {
      getJson<Pastor[]>('/api/pastors', []).then((pastors) => setData((d) => ({ ...d, pastors })))
    },
    calendar() {
      Promise.all([
        getJson<Series[]>('/api/series', []),
        getJson<EventRow[]>('/api/events', []),
        getJson<Cancellation[]>('/api/cancellations', []),
      ]).then(([series, events, cancellations]) => setData((d) => ({ ...d, series, events, cancellations })))
    },
    presets() {
      if (!adminKey) return
      getJson<Preset[]>('/api/admin/presets', [], { key: adminKey }).then(setPresets)
    },
  }

  // ===== Saving =====

  // Drag-and-drop order for Service Times: show it right away, then save
  async function saveSeriesOrder(newOrder: Series[]) {
    if (!admin) return
    setData((d) => ({ ...d, series: newOrder }))
    const res = await sendAdmin(admin, '/api/admin/series', 'PUT', { ids: newOrder.map((s) => s.s_id) })
    if (res.status === 401) return admin.logout()
    if (!res.ok) {
      alert(`Couldn't save the new order: ${await res.text()}`)
      reload.calendar()
    }
  }

  return {
    ...data,
    presets,
    loaded,
    status,
    getItems: (date) => itemsOn(date, data, !!admin),
    refresh,
    reload,
    saveSeriesOrder,
  }
}
