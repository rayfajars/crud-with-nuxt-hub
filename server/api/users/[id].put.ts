import { db, schema } from '@nuxthub/db'
import { eq } from 'drizzle-orm'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isUniqueViolation(err: unknown): boolean {
  const seen = new Set<unknown>()
  let cur: unknown = err
  while (cur && typeof cur === 'object' && !seen.has(cur)) {
    seen.add(cur)
    const e = cur as { code?: string; message?: string; cause?: unknown; constraint_name?: string; constraint?: string }
    if (e.code === '23505') return true
    const msg = `${e.message || ''} ${e.constraint_name || ''} ${e.constraint || ''}`.toLowerCase()
    if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('users_email_unique')) return true
    cur = e.cause
  }
  return false
}

export default eventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  }

  const body = await readBody<{
    name?: string
    email?: string
    phone?: string | null
    avatar?: string
  }>(event)

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'user not found' })
  }

  const updates: {
    name?: string
    email?: string
    phone?: string | null
    avatar?: string
  } = {}

  if (body?.name !== undefined) {
    const name = body.name.trim()
    if (!name) {
      throw createError({ statusCode: 400, statusMessage: 'name cannot be empty' })
    }
    updates.name = name
  }

  if (body?.email !== undefined) {
    const email = body.email.trim()
    if (!email) {
      throw createError({ statusCode: 400, statusMessage: 'email cannot be empty' })
    }
    if (!EMAIL_RE.test(email)) {
      throw createError({ statusCode: 400, statusMessage: 'email is invalid' })
    }
    updates.email = email
  }

  if (body?.avatar !== undefined) {
    const avatar = body.avatar.trim()
    if (!avatar) {
      throw createError({ statusCode: 400, statusMessage: 'avatar cannot be empty' })
    }
    updates.avatar = avatar
  }

  if (body?.phone !== undefined) {
    const phone = typeof body.phone === 'string' ? body.phone.trim() : body.phone
    updates.phone = phone || null
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'no fields to update' })
  }

  try {
    const [user] = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning()

    return user
  }
  catch (err: unknown) {
    if (isUniqueViolation(err)) {
      throw createError({ statusCode: 409, statusMessage: 'email already exists' })
    }
    throw err
  }
})
