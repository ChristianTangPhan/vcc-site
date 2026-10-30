// A location: plain text, or a 📍 map link if marked as a real address,
// with a ⧉ copy button (popups only)
import { useState, type MouseEvent } from 'react'
import { mapsUrl } from '../lib/maps'

export function LocationLine({
  text,
  isAddress,
  showCopy = true,
}: {
  text: string
  isAddress?: boolean
  showCopy?: boolean // false on cards; the copy button only shows in popups
}) {
  return (
    <span className="location-line">
      {isAddress ? (
        <a
          href={mapsUrl(text)}
          target="_blank"
          rel="noopener noreferrer"
          className="map-link"
          onClick={(e) => e.stopPropagation()} // open the map, not the card's popup
        >
          📍 {text}
        </a>
      ) : (
        <span>{text}</span>
      )}
      {showCopy && <CopyButton text={text} />}
    </span>
  )
}

// ⧉ button that copies the text (shows "Copied ✓" for a moment)
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation() // don't also open the card's popup
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Older browsers: copy through a hidden text box
      const box = document.createElement('textarea')
      box.value = text
      box.style.position = 'fixed'
      box.style.opacity = '0'
      document.body.appendChild(box)
      box.select()
      document.execCommand('copy')
      box.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      className={`copy-btn ${copied ? 'copied' : ''}`}
      onClick={copy}
      aria-label={`Copy location: ${text}`}
      title="Copy location"
    >
      {copied ? 'Copied ✓' : '⧉'}
    </button>
  )
}
