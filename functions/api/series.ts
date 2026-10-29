import { neon } from '@neondatabase/serverless'

type Env = { DATABASE_URL: string }

// GET /api/series - every weekly repeating thing (services, practice, prayer...)
export async function onRequestGet(context: { env: Env }) {
  const sql = neon(context.env.DATABASE_URL)
  const rows = await sql`SELECT * FROM get_series()`
  return Response.json(rows)
}
