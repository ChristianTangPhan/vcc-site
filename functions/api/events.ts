// GET /api/events - one-time events
import { handle } from '../_lib/db'

export const onRequestGet = handle((sql) => sql`SELECT * FROM get_events()`)
