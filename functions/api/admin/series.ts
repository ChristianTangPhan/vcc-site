import { neon } from '@neondatabase/serverless'

type Env = { DATABASE_URL: string }

type Body = {
  s_id?: string | null
  s_name?: string
  s_description?: string
  s_location?: string
  s_day?: number
  s_start?: string
  s_end?: string
  s_show_on_home?: boolean
}

function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : 'Unknown error'
  return new Response(msg, { status: 400 })
}

// Empty time box -> NULL (Postgres can't turn "" into a time)
const timeOrNull = (v?: string) => (v && v.trim() ? v : null)

// POST = add (no s_id) or update (with s_id)
export async function onRequestPost(context: { request: Request; env: Env }) {
  const b = (await context.request.json()) as Body
  const sql = neon(context.env.DATABASE_URL)
  try {
    const rows = await sql`
      SELECT upsert_series(
        ${b.s_id ?? null}::bigint,
        ${b.s_name ?? null},
        ${b.s_description ?? null},
        ${b.s_location ?? null},
        ${b.s_day ?? null}::int,
        ${timeOrNull(b.s_start)}::time,
        ${timeOrNull(b.s_end)}::time,
        ${b.s_show_on_home ?? false}::boolean
      ) AS id`
    return Response.json({ id: rows[0].id })
  } catch (err) {
    return errorResponse(err)
  }
}

// DELETE /api/admin/series?id=3
export async function onRequestDelete(context: { request: Request; env: Env }) {
  const id = new URL(context.request.url).searchParams.get('id')
  if (!id) return new Response('Missing id', { status: 400 })
  const sql = neon(context.env.DATABASE_URL)
  try {
    await sql`SELECT delete_series(${id}::bigint)`
    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
