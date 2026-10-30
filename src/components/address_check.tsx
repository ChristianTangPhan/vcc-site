// "This is a real address" checkbox under a Location box
export function AddressCheck({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="check address-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      This is a real address (show a map link)
    </label>
  )
}
