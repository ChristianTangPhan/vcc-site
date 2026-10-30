// Small values saved on this device (localStorage).
// Every call is wrapped because storage can be blocked (e.g. private browsing).

export const STORAGE_KEYS = {
  adminKey: 'adminKey',
  dismissedAnnouncement: 'dismissedAnnouncement',
}

export function readStorage(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // blocked: the value just isn't remembered after the page closes
  }
}

export function removeStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // blocked: nothing to remove
  }
}
