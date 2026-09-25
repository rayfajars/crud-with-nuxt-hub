import { db, schema } from '@nuxthub/db'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  }

  const [deleted] = await db
    .delete(schema.users)
    .where(eq(schema.users.id, id))
    .returning({ id: schema.users.id })

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'user not found' })
  }

  return { ok: true, id: deleted.id }
})
