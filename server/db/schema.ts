import { pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  password: text().notNull(),
  avatar: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  phone: text() //tetap disarankan mengubah tipe data lewat schema langsung karena nanti akan dicatet langsung migrations perubahaannya
  // create migrations :npx nuxt db generate --custom --name drop_phone atau 
  //npx drizzle-kit generate --config=./.nuxt/hub/db/drizzle.config.ts --custom --name=drop_phone
  // npx nuxt db migrate
  // npx nuxt db generate
})
