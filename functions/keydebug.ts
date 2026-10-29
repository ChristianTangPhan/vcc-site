type Env = { ADMIN_KEY?: string }

// TEMPORARY - delete after debugging. Shows only lengths, never the key.
export async function onRequestGet(context: { env: Env }) {
  const k = context.env.ADMIN_KEY
  return Response.json({
    isSet: !!k,
    length: k?.length ?? 0,
    trimmedLength: k?.trim().length ?? 0,
  })
}