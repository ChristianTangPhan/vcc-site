// Wraps a section: editors get a ✏️ button that swaps the section for its editor
import { useState, type ReactNode } from 'react'

export function Editable({
  canEdit,
  editor,
  label = '✏️ Edit',
  className = '',
  children,
}: {
  canEdit: boolean
  editor: (close: () => void) => ReactNode
  label?: string
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`editable ${className}`}>
      {canEdit && open ? editor(() => setOpen(false)) : (
        <>
          {children}
          {canEdit && <button type="button" className="edit-btn" onClick={() => setOpen(true)}>{label}</button>}
        </>
      )}
    </div>
  )
}
