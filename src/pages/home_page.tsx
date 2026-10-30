// Home page: hero, Today, Service Times, Pastors, About — plus the shared editor and details popups
import { useState } from 'react'
import type { Admin, CalItem, EditInfo, EditTarget, Site } from '../types'
import { aboutFields, heroFields } from '../lib/info_fields'
import { Editable } from '../components/editable'
import { CalCard } from '../components/cal_card'
import { Modal } from '../components/modal'
import { ItemEditor } from '../editors/item_editor'
import { TodaySection } from '../sections/today_section'
import { ServiceTimesSection } from '../sections/service_times_section'
import { PastorsSection } from '../sections/pastors_section'

export function HomePage({
  site,
  admin,
  canEditInfo,
  editInfo,
}: {
  site: Site
  admin: Admin | null
  canEditInfo: boolean
  editInfo: EditInfo
}) {
  const { info } = site

  // What's open in a popup (if anything)
  const [editing, setEditing] = useState<EditTarget | null>(null)
  const [details, setDetails] = useState<{ heading: string; item: CalItem } | null>(null)

  const showDetails = (heading: string, item: CalItem) => setDetails({ heading, item })

  return (
    <>
      <section className="hero">
        <Editable canEdit={canEditInfo} editor={editInfo(heroFields)}>
          <h1>{info?.i_name}</h1>
          <p>{info?.i_tagline}</p>
        </Editable>
      </section>

      <TodaySection site={site} admin={admin} onEdit={setEditing} onDetails={showDetails} />
      <ServiceTimesSection site={site} admin={admin} onEdit={setEditing} onDetails={showDetails} />
      <PastorsSection pastors={site.pastors} admin={admin} onSaved={site.reload.pastors} />

      <section id="about">
        <Editable canEdit={canEditInfo} editor={editInfo(aboutFields)}>
          <h2>About Us</h2>
          <p className="about-text">{info?.i_about}</p>
        </Editable>
      </section>

      {editing && admin && (
        <Modal onClose={() => setEditing(null)}>
          <ItemEditor target={editing} site={site} admin={admin} onClose={() => setEditing(null)} />
        </Modal>
      )}

      {details && (
        <Modal onClose={() => setDetails(null)}>
          <p className="muted modal-date">{details.heading}</p>
          <CalCard item={details.item} detailed />
        </Modal>
      )}
    </>
  )
}
