import { neon } from '@neondatabase/serverless'

type Env = { DATABASE_URL: string }

export async function onRequestGet(context: { env: Env }) {
  const sql = neon(context.env.DATABASE_URL)
  const rows = await sql`SELECT * FROM get_service_cancellations()`
  return Response.json(rows)
}