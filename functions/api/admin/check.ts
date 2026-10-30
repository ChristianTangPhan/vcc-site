// GET /api/admin/check - used by the login box; the middleware already checked the key
export const onRequestGet = () => Response.json({ ok: true })
