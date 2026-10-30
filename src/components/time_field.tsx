// Time box that can be left empty, with a "Clear" link (iPhone's picker can't blank it)
export function TimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string // "19:00", or '' for no time
  onChange: (value: string) => void
}) {
  return (
    <label className="time-field">
      <span>
        {label}
        {value && <button type="button" className="time-clear" onClick={() => onChange('')}>Clear</button>}
      </span>
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)} />
      {!value && <small className="muted">No time</small>}
    </label>
  )
}
