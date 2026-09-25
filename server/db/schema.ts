import { pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  phone: text(),
  avatar: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
})
