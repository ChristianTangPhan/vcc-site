// /api/admin/cancellations - skip or restore one date of a weekly series
import { badRequest, handle, readBody, urlParam } from '../../_lib/db'

type Body = {
  s_id?: string
  sc_date?: string
  sc_reason?: string
}

// POST - cancel one date
export const onRequestPost = handle(async (sql, ctx) => {
  const b = await readBody<Body>(ctx)
  if (!b.s_id || !b.sc_date) return badRequest('Missing s_id or sc_date')
  await sql`SELECT cancel_series_date(${b.s_id}::bigint, ${b.sc_date}::date, ${b.sc_reason ?? null})`
})

// DELETE ?s_id=3&date=2026-11-12 - restore that date
export const onRequestDelete = handle(async (sql, ctx) => {
  const sId = urlParam(ctx, 's_id')
  const date = urlParam(ctx, 'date')
  if (!sId || !date) return badRequest('Missing s_id or date')
  await sql`SELECT restore_series_date(${sId}::bigint, ${date}::date)`
})
