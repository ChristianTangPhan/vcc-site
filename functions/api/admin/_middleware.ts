// Runs before every /api/admin/* request: rejects anything without the right admin key
type Env = { ADMIN_KEY?: string }

// Hash both sides and compare every byte, so the check takes the same time
// whether the guess is close or not (prevents guessing the key letter by letter)
async function sha256(text: string) {
  const data = new TextEncoder().encode(text)
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data))
}

async function keysMatch(given: string, expected: string) {
  const a = await sha256(given)
  const b = await sha256(expected)
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export async function onRequest(context: { request: Request; env: Env; next: () => Promise<Response> }) {
  const auth = context.request.headers.get('Authorization') ?? ''
  const given = auth.replace(/^Bearer /, '').trim()
  const expected = context.env.ADMIN_KEY?.trim() // ignore stray spaces/newlines from pasting

  if (!expected || !given || !(await keysMatch(given, expected))) {
    return new Response('Unauthorized', { status: 401 })
  }
  return context.next()
}
