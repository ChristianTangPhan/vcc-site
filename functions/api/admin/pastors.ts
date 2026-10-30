// /api/admin/pastors - add, edit, or delete a pastor
import { badRequest, handle, readBody, urlParam } from '../../_lib/db'

type Body = {
  p_id?: string | null
  p_name?: string
  p_phone_number?: string
  p_email?: string
  p_image?: string
}

// POST - add (no p_id) or update (with p_id)
export const onRequestPost = handle(async (sql, ctx) => {
  const b = await readBody<Body>(ctx)
  const rows = await sql`
    SELECT upsert_pastor(
      ${b.p_id ?? null}::bigint,
      ${b.p_name ?? null},
      ${b.p_phone_number ?? null},
      ${b.p_email ?? null},
      ${b.p_image ?? null}
    ) AS id`
  return { id: rows[0].id }
})

// DELETE ?id=3
export const onRequestDelete = handle(async (sql, ctx) => {
  const id = urlParam(ctx, 'id')
  if (!id) return badRequest('Missing id')
  await sql`SELECT delete_pastor(${id}::bigint)`
})
