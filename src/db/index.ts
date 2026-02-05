import { eq } from "drizzle-orm";
import type { DrizzleDb } from "../index.js";
import { publicKeys, txData } from "./schema.js";
import type { ConnectPayinRequest } from "../connect/payin.js";

export class Db {
  constructor(private db: DrizzleDb) {}

  async safeSaveMapping(payinRequest: ConnectPayinRequest, gwId: string) {
    try {
      return await this.db.transaction(async (tx) => {
        let publicKey = payinRequest.settings.assets_public_key;
        await tx
          .insert(publicKeys)
          .values({ key: publicKey })
          .onConflictDoNothing();

        const pubKeyRow = await tx
          .select({ id: publicKeys.id })
          .from(publicKeys)
          .where(eq(publicKeys.key, publicKey))
          .get();

        if (!pubKeyRow) {
          throw Error("row with public key was not found");
        }

        await tx.insert(txData).values({
          gateway_token: gwId,
          private_key: payinRequest.payment.merchant_private_key,
          token: payinRequest.payment.token,
          pub_key_id: pubKeyRow.id,
        });
      });
    } catch (e) {
      console.log(`ERROR: failed to insert database mapping`, e);
    }
  }

  async getMapping(gwId: string) {
    try {
      return await this.db
        .select({
          privateKey: txData.private_key,
          token: txData.token,
          publicKey: publicKeys.key,
        })
        .from(txData)
        .innerJoin(publicKeys, eq(txData.pub_key_id, publicKeys.id))
        .where(eq(txData.gateway_token, gwId))
        .get();
    } catch (e) {
      console.log("ERROR: failed to lookup database mapping", e);
    }
  }
}
