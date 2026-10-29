// Label + text box (or big text area)
export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  multiline?: boolean
}) {
  return (
    <label>
      <span>{label}</span>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}
