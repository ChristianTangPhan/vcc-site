import type { ReactNode } from 'react'

// Popup over the page (tap outside or ✕ to close)
export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      {/* stopPropagation: a tap inside the popup shouldn't count as a tap on the background */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        {children}
      </div>
    </div>
  )
}
