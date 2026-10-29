import { useState, type ReactNode } from 'react'

// Wraps something: shows a ✏️ button for editors; tapping it swaps in the editor
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

  if (canEdit && open) {
    return <div className={`editable ${className}`}>{editor(() => setOpen(false))}</div>
  }

  return (
    <div className={`editable ${className}`}>
      {children}
      {canEdit && (
        <button type="button" className="edit-btn" onClick={() => setOpen(true)}>
          {label}
        </button>
      )}
    </div>
  )
}
