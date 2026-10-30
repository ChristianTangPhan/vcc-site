// GET /api/cancellations - dates skipped for each weekly series
import { handle } from '../_lib/db'

export const onRequestGet = handle((sql) => sql`SELECT * FROM get_series_cancellations()`)
