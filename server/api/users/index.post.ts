import { db, schema } from '@nuxthub/db'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/initials/svg?seed=User'

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
  const body = await readBody<{
    name?: string
    email?: string
    phone?: string | null
    avatar?: string
  }>(event)

  const name = body?.name?.trim()
  const email = body?.email?.trim()
  const phone = body?.phone?.trim() || null
  const avatar = body?.avatar?.trim() || DEFAULT_AVATAR

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'email is required' })
  }
  if (!EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'email is invalid' })
  }

  try {
    const [user] = await db
      .insert(schema.users)
      .values({ name, email, phone, avatar })
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
