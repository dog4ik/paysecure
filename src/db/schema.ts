import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const keyMapping = sqliteTable("private_key_mapping", {
  id: integer().primaryKey(),
  private_key: text().notNull(),
  gateway_token: text().notNull().unique(),
  token: text().notNull(),
});
