import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { PayinRequestSchema } from "./connect/payin.js";
import { StatusRequestSchema } from "./connect/status.js";
import { GatewayClient, gatewayStatusMapping } from "./gateway/index.js";
import { drizzle } from "drizzle-orm/libsql";
import { PaysecureWebhookSchema } from "./gateway/callback.js";
import type { GwConnectError } from "./connect/error.js";
import { zValidator } from "./validator_wrapper.js";
import { createJwt } from "./connect/callback.js";
import { GatewayError } from "./gateway/error.js";
import type { InteractionLog } from "./interaction_logs.js";
import { requireEnv } from "./env.js";
import { Db } from "./db/index.js";
import { normalizeExtraReturnParam } from "./connect/index.js";

export const BusinessUrl = requireEnv("BUSINESS_URL");
export const SignKey = requireEnv("SIGN_KEY");
export const ApiBaseUrl = requireEnv("API_BASE_URL");
export const AppBaseUrl = requireEnv("APP_BASE_URL");
export const Port = parseInt(requireEnv("PORT"));
if (Number.isNaN(Port)) {
  throw Error(`Invalid port number value`);
}

const drizzleDb = drizzle(requireEnv("DB_FILE_NAME"));
export type DrizzleDb = typeof drizzleDb;
const db = new Db(drizzleDb);
const app = new Hono();

app.use(logger());
app.use(async (c, next) => {
  try {
    console.log(
      "Gateway connect request body:",
      JSON.stringify(await c.req.json()),
    );
  } catch {}
  await next();
});

function createGCError(e: any, interactionLogs: InteractionLog[]) {
  if (e instanceof GatewayError) {
    return {
      result: false,
      error: `Gateway error: ${e.gwMessage} (${e.gwCode})`,
      logs: interactionLogs,
    } as GwConnectError;
  } else if (e instanceof Error) {
    return {
      result: false,
      error: `Gateway Connect error: ${e.message}`,
      logs: interactionLogs,
    } as GwConnectError;
  } else {
    console.error(e);
    return {
      result: false,
      error: "Gateway Connect error, please check logs for more details",
      logs: interactionLogs,
    } as GwConnectError;
  }
}

app
  .post("/pay", zValidator("json", PayinRequestSchema), async (c) => {
    let payRequest = c.req.valid("json");
    let gateway = new GatewayClient(payRequest.settings);
    let extraReturnParam = normalizeExtraReturnParam(
      payRequest.payment.extra_return_param,
    );

    try {
      if (extraReturnParam) {
        let response = await gateway.purchasesPayin(payRequest);
        let gateway_token = response.purchaseId;

        await db.safeSaveMapping(
          payRequest.payment.merchant_private_key,
          gateway_token,
          payRequest.payment.token,
        );

        let rpStatus = gatewayStatusMapping(response.status);
        return c.json({
          status: gatewayStatusMapping(response.status),
          details:
            rpStatus === "declined"
              ? (response.errorMsg ?? undefined)
              : undefined,
          amount: response.purchase.total * 100,
          currency: response.purchase.currency,
          redirect_request: {
            type: "get_with_processing",
            url: response.checkout_url,
          },
          logs: gateway.interactionLogs.build(),
          gateway_token,
          result: true,
        });
      } else {
        let response = await gateway.cashierPayin(payRequest);
        let gateway_token = response.sessionId;

        await db.safeSaveMapping(
          payRequest.payment.merchant_private_key,
          gateway_token,
          payRequest.payment.token,
        );

        return c.json({
          status: "pending",
          redirect_request: {
            type: "get_with_processing",
            url: response.sessionUrl,
          },
          logs: gateway.interactionLogs.build(),
          gateway_token,
          result: true,
        });
      }
    } catch (e) {
      return c.json(createGCError(e, gateway.interactionLogs.build()));
    }
  })
  .post("/status", zValidator("json", StatusRequestSchema), async (c) => {
    let statusRequest = c.req.valid("json");
    let gateway = new GatewayClient(statusRequest.settings);
    try {
      let data = await gateway.status(statusRequest);
      let rpStatus = gatewayStatusMapping(data.status);
      return c.json({
        status: rpStatus,
        amount: data.purchase.total * 100,
        currency: data.purchase.currency,
        result: true,
        details: rpStatus === "declined" ? (data.errorMsg ?? "") : "",
        logs: gateway.interactionLogs.build(),
      });
    } catch (e) {
      return c.json(createGCError(e, gateway.interactionLogs.build()));
    }
  })
  .post(
    "/gateway/callback",
    zValidator("json", PaysecureWebhookSchema),
    async (c) => {
      let callback = c.req.valid("json");
      let mapping = await db.getMapping(callback.message.purchaseId);
      if (!mapping) {
        console.log("Failed to find purchase id in merchant key mapping");
        return c.json({ message: "Purchase not found" }, 404);
      }

      let url =
        BusinessUrl + `/callbacks/v2/gateway_callbacks/${mapping.token}`;
      let rpStatus = gatewayStatusMapping(callback.status);
      let payload = {
        status: rpStatus,
        reason:
          rpStatus === "declined"
            ? callback.message.errorMsg || callback.status
            : undefined,
        currency: callback.message.payment.currency,
        amount: Math.floor(callback.message.payment.amount * 100),
      };
      let jwt = createJwt(payload, mapping.private_key, Buffer.from(SignKey));
      await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      });
    },
  );

serve(
  {
    fetch: app.fetch,
    port: Port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
