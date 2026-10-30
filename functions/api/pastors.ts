// GET /api/pastors - pastors
import { handle } from '../_lib/db'

export const onRequestGet = handle((sql) => sql`SELECT * FROM get_pastors()`)
