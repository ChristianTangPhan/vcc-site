// Save / Cancel / (Delete) row at the bottom of every form, plus its status message
export function FormActions({
  status,
  onCancel,
  onDelete,
  saveLabel = 'Save',
  sticky,
}: {
  status: string
  onCancel?: () => void
  onDelete?: () => void
  saveLabel?: string
  sticky?: boolean // pinned to the bottom when inside a popup
}) {
  return (
    <div className={`admin-actions ${sticky ? 'sticky-actions' : ''}`}>
      <button type="submit">{saveLabel}</button>
      {onCancel && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      {onDelete && <button type="button" className="danger" onClick={onDelete}>Delete</button>}
      {status && <span className="muted status-text">{status}</span>}
    </div>
  )
}
