import { neon } from '@neondatabase/serverless'

type Env = { DATABASE_URL: string }
type Body = Record<string, string | null | undefined>

export async function onRequestPut(context: { request: Request; env: Env }) {
  const b = (await context.request.json()) as Body
  const sql = neon(context.env.DATABASE_URL)

  // ${...} values are sent as parameters, not pasted into the SQL, so this is safe from SQL injection
  await sql`
    SELECT update_church_info(
      ${b.i_name ?? null}, ${b.i_abrv ?? null}, ${b.i_tagline ?? null},
      ${b.i_about ?? null}, ${b.i_address ?? null}, ${b.i_phone ?? null},
      ${b.i_email ?? null}, ${b.i_facebook ?? null}, ${b.i_youtube ?? null},
      ${b.i_announcement ?? null}
    )`

  return Response.json({ ok: true })
}