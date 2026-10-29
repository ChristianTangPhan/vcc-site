// Apple Maps on Apple devices, Google Maps everywhere else
export function mapsUrl(address: string) {
  const q = encodeURIComponent(address)
  const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
  return isApple
    ? `https://maps.apple.com/?q=${q}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`
}
