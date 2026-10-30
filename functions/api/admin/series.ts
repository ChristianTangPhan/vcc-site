// /api/admin/series - add, edit, reorder, or delete a weekly series
import { badRequest, blankToNull, handle, readBody, urlParam } from '../../_lib/db'

type Body = {
  s_id?: string | null
  s_name?: string
  s_description?: string
  s_location?: string
  s_location_is_address?: boolean
  s_day?: number
  s_start?: string
  s_end?: string
  s_show_on_home?: boolean
}

// POST - add (no s_id) or update (with s_id)
export const onRequestPost = handle(async (sql, ctx) => {
  const b = await readBody<Body>(ctx)
  const rows = await sql`
    SELECT upsert_series(
      ${b.s_id ?? null}::bigint,
      ${b.s_name ?? null},
      ${b.s_description ?? null},
      ${b.s_location ?? null},
      ${b.s_day ?? null}::int,
      ${blankToNull(b.s_start)}::time,
      ${blankToNull(b.s_end)}::time,
      ${b.s_show_on_home ?? false}::boolean,
      ${b.s_location_is_address ?? false}::boolean
    ) AS id`
  return { id: rows[0].id }
})

// PUT - save drag-and-drop order: { ids: ["3", "1", "2"] } (first = top)
export const onRequestPut = handle(async (sql, ctx) => {
  const b = await readBody<{ ids?: string[] }>(ctx)
  if (!Array.isArray(b.ids) || b.ids.length === 0) return badRequest('Missing ids')
  await sql`SELECT reorder_series(${b.ids}::bigint[])`
})

// DELETE ?id=3
export const onRequestDelete = handle(async (sql, ctx) => {
  const id = urlParam(ctx, 'id')
  if (!id) return badRequest('Missing id')
  await sql`SELECT delete_series(${id}::bigint)`
})
