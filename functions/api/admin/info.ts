// PUT /api/admin/info - save the church info row
import { handle, readBody } from '../../_lib/db'

type Body = Record<string, string | null | undefined>

export const onRequestPut = handle(async (sql, ctx) => {
  const b = await readBody<Body>(ctx)
  await sql`
    SELECT update_church_info(
      ${b.i_name ?? null},
      ${b.i_abrv ?? null},
      ${b.i_tagline ?? null},
      ${b.i_about ?? null},
      ${b.i_address ?? null},
      ${b.i_phone ?? null},
      ${b.i_email ?? null},
      ${b.i_facebook ?? null},
      ${b.i_youtube ?? null},
      ${b.i_announcement ?? null}
    )`
})
