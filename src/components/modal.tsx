import { useEffect, type ReactNode } from 'react'

// Popup over the page. The ✕ stays pinned at the top while the content scrolls,
// and the popup always fits on screen (even with iPhone Safari's toolbars).
export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  // Stop the page behind from scrolling while the popup is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {/* stopPropagation: a tap inside the popup shouldn't count as a tap on the background */}
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
