import { neon } from '@neondatabase/serverless'

type Env = { DATABASE_URL: string }

type Body = {
  p_id?: string | null
  p_name?: string
  p_phone_number?: string
  p_email?: string
  p_image?: string
}

function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : 'Unknown error'
  return new Response(msg, { status: 400 })
}

// POST = add (no p_id) or update (with p_id)
export async function onRequestPost(context: { request: Request; env: Env }) {
  const b = (await context.request.json()) as Body
  const sql = neon(context.env.DATABASE_URL)
  try {
    const rows = await sql`
      SELECT upsert_pastor(
        ${b.p_id ?? null}::bigint,
        ${b.p_name ?? null},
        ${b.p_phone_number ?? null},
        ${b.p_email ?? null},
        ${b.p_image ?? null}
      ) AS id`
    return Response.json({ id: rows[0].id })
  } catch (err) {
    return errorResponse(err)
  }
}

// DELETE /api/admin/pastors?id=3
export async function onRequestDelete(context: { request: Request; env: Env }) {
  const id = new URL(context.request.url).searchParams.get('id')
  if (!id) return new Response('Missing id', { status: 400 })
  const sql = neon(context.env.DATABASE_URL)
  try {
    await sql`SELECT delete_pastor(${id}::bigint)`
    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}