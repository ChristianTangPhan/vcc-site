// Shared helpers for every API file (no routes in here, just tools)
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

export type Env = { DATABASE_URL: string }
export type Ctx = { request: Request; env: Env }
export type Sql = NeonQueryFunction<false, false>

// Wraps a handler: opens the database, returns its result as JSON,
// and turns any error into a 400 with the message (shown in the editor)
export function handle(run: (sql: Sql, ctx: Ctx) => Promise<unknown>) {
  return async (ctx: Ctx) => {
    try {
      const result = await run(neon(ctx.env.DATABASE_URL), ctx)
      if (result instanceof Response) return result
      return Response.json(result === undefined ? { ok: true } : result)
    } catch (err) {
      return badRequest(err instanceof Error ? err.message : 'Unknown error')
    }
  }
}

// 400 response with a message
export function badRequest(message: string) {
  return new Response(message, { status: 400 })
}

// Request body as JSON
export async function readBody<T>(ctx: Ctx): Promise<T> {
  return (await ctx.request.json()) as T
}

// ?name=value from the URL
export function urlParam(ctx: Ctx, name: string) {
  return new URL(ctx.request.url).searchParams.get(name)
}

// Empty text box -> NULL (Postgres can't turn "" into a date/time)
export function blankToNull(value?: string | null) {
  return value && value.trim() ? value : null
}
