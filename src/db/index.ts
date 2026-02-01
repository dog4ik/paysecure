import { eq } from "drizzle-orm";
import type { DrizzleDb } from "../index.js";
import { keyMapping } from "./schema.js";

export class Db {
  constructor(private db: DrizzleDb) {}

  async safeSaveMapping(privateKey: string, gwId: string, token: string) {
    return this.db
      .insert(keyMapping)
      .values({ gateway_token: gwId, private_key: privateKey, token })
      .catch((e) => {
        console.log(`ERROR: failed to insert database mapping`, e);
      });
  }

  async getMapping(gwId: string) {
    return this.db
      .select()
      .from(keyMapping)
      .where(eq(keyMapping.gateway_token, gwId))
      .get()
      .catch((e) => {
        console.log(`ERROR: failed to lookup database mapping`, e);
      });
  }
}
