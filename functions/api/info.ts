// GET /api/info - the single church info row (name, about, address, announcement…)
import { handle } from '../_lib/db'

export const onRequestGet = handle(async (sql) => {
  const rows = await sql`SELECT * FROM get_church_info()`
  return rows[0] ?? null
})
