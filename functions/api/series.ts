// GET /api/series - weekly series (services, practice, prayer…)
import { handle } from '../_lib/db'

export const onRequestGet = handle((sql) => sql`SELECT * FROM get_series()`)
