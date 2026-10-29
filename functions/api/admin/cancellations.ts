import { neon } from '@neondatabase/serverless'

type Env = { DATABASE_URL: string }

type Body = {
  s_id?: string
  sc_date?: string
  sc_reason?: string
}

function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : 'Unknown error'
  return new Response(msg, { status: 400 })
}

// POST = cancel one date of a service
export async function onRequestPost(context: { request: Request; env: Env }) {
  const b = (await context.request.json()) as Body
  if (!b.s_id || !b.sc_date) return new Response('Missing s_id or sc_date', { status: 400 })
  const sql = neon(context.env.DATABASE_URL)
  try {
    await sql`SELECT cancel_service_date(${b.s_id}::bigint, ${b.sc_date}::date, ${b.sc_reason ?? null})`
    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}

// DELETE /api/admin/cancellations?s_id=3&date=2026-11-12  (restore that date)
export async function onRequestDelete(context: { request: Request; env: Env }) {
  const params = new URL(context.request.url).searchParams
  const sId = params.get('s_id')
  const date = params.get('date')
  if (!sId || !date) return new Response('Missing s_id or date', { status: 400 })
  const sql = neon(context.env.DATABASE_URL)
  try {
    await sql`SELECT restore_service_date(${sId}::bigint, ${date}::date)`
    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}