// /api/admin/presets - list, add, edit, or delete event presets
import { badRequest, blankToNull, handle, readBody, urlParam } from '../../_lib/db'

type Body = {
  ep_id?: string
  ep_label?: string
  ep_name?: string
  ep_description?: string
  ep_location?: string
  ep_location_is_address?: boolean
  ep_start?: string
  ep_end?: string
}

// GET - all presets (editors only, since it's under /admin)
export const onRequestGet = handle((sql) => sql`SELECT * FROM get_event_presets()`)

// POST - save by name (same name overwrites)
export const onRequestPost = handle(async (sql, ctx) => {
  const b = await readBody<Body>(ctx)
  if (!b.ep_label?.trim()) return badRequest('Preset name is required')
  const rows = await sql`
    SELECT upsert_event_preset(
      ${b.ep_label},
      ${b.ep_name ?? null},
      ${b.ep_description ?? null},
      ${b.ep_location ?? null},
      ${blankToNull(b.ep_start)}::time,
      ${blankToNull(b.ep_end)}::time,
      ${b.ep_location_is_address ?? false}::boolean
    ) AS id`
  return { id: rows[0].id }
})

// PUT - edit by id (lets you rename it)
export const onRequestPut = handle(async (sql, ctx) => {
  const b = await readBody<Body>(ctx)
  if (!b.ep_id) return badRequest('Missing ep_id')
  if (!b.ep_label?.trim()) return badRequest('Preset name is required')
  await sql`
    SELECT update_event_preset(
      ${b.ep_id}::bigint,
      ${b.ep_label},
      ${b.ep_name ?? null},
      ${b.ep_description ?? null},
      ${b.ep_location ?? null},
      ${blankToNull(b.ep_start)}::time,
      ${blankToNull(b.ep_end)}::time,
      ${b.ep_location_is_address ?? false}::boolean
    )`
})

// DELETE ?id=3
export const onRequestDelete = handle(async (sql, ctx) => {
  const id = urlParam(ctx, 'id')
  if (!id) return badRequest('Missing id')
  await sql`SELECT delete_event_preset(${id}::bigint)`
})
