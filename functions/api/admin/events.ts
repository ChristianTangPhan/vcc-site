import { neon } from '@neondatabase/serverless'

type Env = { DATABASE_URL: string }

type Body = {
  e_id?: string | null
  e_name?: string
  e_description?: string
  e_location?: string
  e_date?: string
  e_start?: string
  e_end?: string
}

function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : 'Unknown error'
  return new Response(msg, { status: 400 })
}

// Empty box -> NULL (Postgres can't turn "" into a date/time)
const orNull = (v?: string) => (v && v.trim() ? v : null)

// POST = add (no e_id) or update (with e_id)
export async function onRequestPost(context: { request: Request; env: Env }) {
  const b = (await context.request.json()) as Body
  const sql = neon(context.env.DATABASE_URL)
  try {
    const rows = await sql`
      SELECT upsert_event(
        ${b.e_id ?? null}::bigint,
        ${b.e_name ?? null},
        ${b.e_description ?? null},
        ${b.e_location ?? null},
        ${orNull(b.e_date)}::date,
        ${orNull(b.e_start)}::time,
        ${orNull(b.e_end)}::time
      ) AS id`
    return Response.json({ id: rows[0].id })
  } catch (err) {
    return errorResponse(err)
  }
}

// DELETE /api/admin/events?id=3
export async function onRequestDelete(context: { request: Request; env: Env }) {
  const id = new URL(context.request.url).searchParams.get('id')
  if (!id) return new Response('Missing id', { status: 400 })
  const sql = neon(context.env.DATABASE_URL)
  try {
    await sql`SELECT delete_event(${id}::bigint)`
    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}