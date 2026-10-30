import { useState, type MouseEvent } from 'react'
import { mapsUrl } from '../lib/maps'

// Small ⧉ button that copies text (e.g. an address to paste into Maps)
export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
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
      aria-label={`${label}: ${text}`}
      title={label}
    >
      {copied ? 'Copied ✓' : '⧉'}
    </button>
  )
}

// Location text with a copy button next to it.
// isAddress = admin marked it a real address -> tappable map link (Apple Maps on iPhone, Google elsewhere)
export function LocationLine({
  text,
  isAddress,
  className = '',
}: {
  text: string
  isAddress?: boolean
  className?: string
}) {
  return (
    <span className={`location-line ${className}`}>
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
      <CopyButton text={text} label="Copy location" />
    </span>
  )
}
