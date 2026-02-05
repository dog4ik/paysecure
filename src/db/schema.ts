import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const publicKeys = sqliteTable("pub_keys", {
  id: integer().primaryKey(),
  key: text().notNull().unique(),
});

export const txData = sqliteTable("tx_data", {
  id: integer().primaryKey(),
  private_key: text().notNull(),
  gateway_token: text().notNull().unique(),
  token: text().notNull(),
  pub_key_id: integer()
    .notNull()
    .references(() => publicKeys.id),
});
