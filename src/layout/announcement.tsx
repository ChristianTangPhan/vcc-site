// Yellow announcement banner. Visitors can close it (it comes back if the text changes);
// editors always see it, or a placeholder with "+ Add announcement".
import { useState } from 'react'
import type { ChurchInfo, EditInfo } from '../types'
import { announcementFields } from '../lib/info_fields'
import { readStorage, STORAGE_KEYS, writeStorage } from '../lib/storage'
import { Editable } from '../components/editable'

export function Announcement({
  info,
  canEdit,
  editInfo,
}: {
  info: ChurchInfo | null
  canEdit: boolean
  editInfo: EditInfo
}) {
  const [dismissed, setDismissed] = useState(() => readStorage(STORAGE_KEYS.dismissedAnnouncement))
  const text = info?.i_announcement?.trim() || null

  function dismiss() {
    if (!text) return
    setDismissed(text)
    writeStorage(STORAGE_KEYS.dismissedAnnouncement, text)
  }

  if (canEdit) {
    return (
      <Editable canEdit editor={editInfo(announcementFields)} label={text ? '✏️ Edit' : '+ Add announcement'}>
        {text ? (
          <div className="announcement" role="alert">
            <p>{text}</p>
          </div>
        ) : (
          <div className="announcement-empty">No announcement right now</div>
        )}
      </Editable>
    )
  }

  if (!text || text === dismissed) return null
  return (
    <div className="announcement" role="alert">
      <p>{text}</p>
      <button onClick={dismiss} aria-label="Dismiss announcement">×</button>
    </div>
  )
}
