// /api/admin/events - add, edit, or delete a one-time event
import { badRequest, blankToNull, handle, readBody, urlParam } from '../../_lib/db'

type Body = {
  e_id?: string | null
  e_name?: string
  e_description?: string
  e_location?: string
  e_location_is_address?: boolean
  e_date?: string
  e_start?: string
  e_end?: string
}

// POST - add (no e_id) or update (with e_id)
export const onRequestPost = handle(async (sql, ctx) => {
  const b = await readBody<Body>(ctx)
  const rows = await sql`
    SELECT upsert_event(
      ${b.e_id ?? null}::bigint,
      ${b.e_name ?? null},
      ${b.e_description ?? null},
      ${b.e_location ?? null},
      ${blankToNull(b.e_date)}::date,
      ${blankToNull(b.e_start)}::time,
      ${blankToNull(b.e_end)}::time,
      ${b.e_location_is_address ?? false}::boolean
    ) AS id`
  return { id: rows[0].id }
})

// DELETE ?id=3
export const onRequestDelete = handle(async (sql, ctx) => {
  const id = urlParam(ctx, 'id')
  if (!id) return badRequest('Missing id')
  await sql`SELECT delete_event(${id}::bigint)`
})
