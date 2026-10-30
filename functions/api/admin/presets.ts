import { neon } from '@neondatabase/serverless'

type Env = { DATABASE_URL: string }

type Body = {
  ep_label?: string
  ep_name?: string
  ep_description?: string
  ep_location?: string
  ep_location_is_address?: boolean
  ep_start?: string
  ep_end?: string
}

function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : 'Unknown error'
  return new Response(msg, { status: 400 })
}

const orNull = (v?: string) => (v && v.trim() ? v : null)

// GET = list presets (editors only, since it's under /admin)
export async function onRequestGet(context: { env: Env }) {
  const sql = neon(context.env.DATABASE_URL)
  const rows = await sql`SELECT * FROM get_event_presets()`
  return Response.json(rows)
}

// POST = save preset (same label overwrites)
export async function onRequestPost(context: { request: Request; env: Env }) {
  const b = (await context.request.json()) as Body
  if (!b.ep_label?.trim()) return new Response('Preset name is required', { status: 400 })
  const sql = neon(context.env.DATABASE_URL)
  try {
    const rows = await sql`
      SELECT upsert_event_preset(
        ${b.ep_label},
        ${b.ep_name ?? null},
        ${b.ep_description ?? null},
        ${b.ep_location ?? null},
        ${orNull(b.ep_start)}::time,
        ${orNull(b.ep_end)}::time,
        ${b.ep_location_is_address ?? false}::boolean
      ) AS id`
    return Response.json({ id: rows[0].id })
  } catch (err) {
    return errorResponse(err)
  }
}

// DELETE /api/admin/presets?id=3
export async function onRequestDelete(context: { request: Request; env: Env }) {
  const id = new URL(context.request.url).searchParams.get('id')
  if (!id) return new Response('Missing id', { status: 400 })
  const sql = neon(context.env.DATABASE_URL)
  try {
    await sql`SELECT delete_event_preset(${id}::bigint)`
    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}

// PUT = edit an existing preset by id (lets you rename it)
export async function onRequestPut(context: { request: Request; env: Env }) {
  const b = (await context.request.json()) as Body & { ep_id?: string }
  if (!b.ep_id) return new Response('Missing ep_id', { status: 400 })
  if (!b.ep_label?.trim()) return new Response('Preset name is required', { status: 400 })
  const sql = neon(context.env.DATABASE_URL)
  try {
    await sql`
      SELECT update_event_preset(
        ${b.ep_id}::bigint,
        ${b.ep_label},
        ${b.ep_name ?? null},
        ${b.ep_description ?? null},
        ${b.ep_location ?? null},
        ${orNull(b.ep_start)}::time,
        ${orNull(b.ep_end)}::time,
        ${b.ep_location_is_address ?? false}::boolean
      )`
    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}