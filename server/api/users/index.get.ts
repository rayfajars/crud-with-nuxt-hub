import { db, schema } from '@nuxthub/db'

export default eventHandler(async () => {
  return await db.select().from(schema.users)
})
