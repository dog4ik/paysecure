import { z } from "zod";

export const GatewayStatusSchema = z.enum([
  "PAID",
  "PAYMENT_IN_PROCESS",
  "EXPIRED",
  "ERROR",
]);

export type GatewayStatus = z.infer<typeof GatewayStatusSchema>;
export const StatusResponseSchema = z.object({
  purchaseId: z.string(),
  errorMsg: z.string().nullish(),
  errorCode: z.string().nullish(),
  status: GatewayStatusSchema,
  purchase: z.object({
    total: z.number(),
    currency: z.string(),
  }),
});
