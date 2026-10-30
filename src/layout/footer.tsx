// Footer: address (map link), phone, email, social links
import type { ChurchInfo, EditInfo } from '../types'
import { contactFields } from '../lib/info_fields'
import { mapsUrl } from '../lib/maps'
import { Editable } from '../components/editable'

export function Footer({
  info,
  canEdit,
  editInfo,
}: {
  info: ChurchInfo | null
  canEdit: boolean
  editInfo: EditInfo
}) {
  return (
    <footer>
      <Editable canEdit={canEdit} editor={editInfo(contactFields)}>
        {info?.i_address && (
          <p>
            <a href={mapsUrl(info.i_address)} target="_blank" rel="noopener noreferrer">
              📍 {info.i_address}
            </a>
          </p>
        )}
        {info?.i_phone && <p><a href={`tel:${info.i_phone}`}>{info.i_phone}</a></p>}
        {info?.i_email && <p><a href={`mailto:${info.i_email}`}>{info.i_email}</a></p>}
        <p>
          {info?.i_facebook && <a href={info.i_facebook}>Facebook</a>}
          {info?.i_facebook && info?.i_youtube && ' · '}
          {info?.i_youtube && <a href={info.i_youtube}>YouTube</a>}
        </p>
        <p className="muted">© {new Date().getFullYear()} {info?.i_name}</p>
      </Editable>
    </footer>
  )
}
