// The whole site: shared header / bars / footer around the page for the current URL
import { useEffect, useState } from 'react'
import './App.css'

import type { Admin, EditInfo } from './types'
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from './lib/storage'
import { useSite } from './hooks/use_site'
import { Header, type Page } from './layout/header'
import { AdminBar, LoadBar } from './layout/status_bars'
import { Announcement } from './layout/announcement'
import { Footer } from './layout/footer'
import { InfoEditor } from './editors/info_editor'
import { HomePage } from './pages/home_page'
import { CalendarPage } from './pages/calendar_page'
import { AdminPage } from './pages/admin_page'

// Which page the URL is on
function currentPage(): Page {
  const path = window.location.pathname
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/calendar')) return 'calendar'
  return 'home'
}

function App() {
  const page = currentPage()

  // ===== Editing (admin key saved on this device) =====

  const [adminKey, setAdminKey] = useState(() => readStorage(STORAGE_KEYS.adminKey))

  const [viewMode, setViewMode] = useState(() => readStorage(STORAGE_KEYS.viewMode) === '1')

  // Save the key, then go to the home page to edit
  function login(key: string) {
    writeStorage(STORAGE_KEYS.adminKey, key)
    removeStorage(STORAGE_KEYS.viewMode) // fresh login starts in Edit mode
    setAdminKey(key)
    window.location.href = '/'
  }

  function logout() {
    removeStorage(STORAGE_KEYS.adminKey)
    setAdminKey(null)
  }

  // View mode: logged in, but the pages get no admin so they look like a visitor's
  function setEditing(editing: boolean) {
    if (editing) removeStorage(STORAGE_KEYS.viewMode)
    else writeStorage(STORAGE_KEYS.viewMode, '1')
    setViewMode(!editing)
  }

  const loggedIn = !!adminKey
  const admin: Admin | null = adminKey && !viewMode ? { key: adminKey, logout } : null

  // ===== Data =====

  const site = useSite(admin)
  const { info } = site
  const canEditInfo = !!admin && !!info

  // Inline editor for a group of church-info fields (hero, about, footer, announcement)
  const editInfo: EditInfo = (fields) => (close) =>
    info && admin ? <InfoEditor info={info} fields={fields} admin={admin} onSaved={site.reload.info} onClose={close} /> : null

  // ===== Page effects =====

  // After the first load, jump to the #section in the URL (e.g. /#pastors)
  useEffect(() => {
    if (!site.loaded) return
    const id = window.location.hash.slice(1)
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [site.loaded])

  // Browser tab title
  useEffect(() => {
    if (!info?.i_name) return
    if (page === 'calendar') document.title = `Calendar · ${info.i_name}`
    else if (page === 'admin') document.title = `Admin · ${info.i_name}`
    else document.title = info.i_name
  }, [info, page])

  return (
    <>
      <Header info={info} page={page} status={site.status} onRefresh={site.refresh} />
      <LoadBar status={site.status} onRetry={site.refresh} />
      {loggedIn && <AdminBar editing={!viewMode} onChange={setEditing} />}
      <Announcement info={info} canEdit={canEditInfo} editInfo={editInfo} />

      {page === 'admin' && <AdminPage unlocked={loggedIn} onLogin={login} onLogout={logout} />}
      {page === 'calendar' && <CalendarPage site={site} admin={admin} />}
      {page === 'home' && <HomePage site={site} admin={admin} canEditInfo={canEditInfo} editInfo={editInfo} />}

      <Footer info={info} canEdit={canEditInfo} editInfo={editInfo} />
    </>
  )
}

export default App
