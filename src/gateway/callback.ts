import { z } from "zod";

export const TransactionStatusEnum = z.enum([
  "error",
  "cancelled",
  "created",
  "expired",
  "overdue",
  "paid",
  "refunded",
  "fraud_refunded",
  "chargeback",
  "payment_in_process",
  "refund_in_process",
]);

const PurchaseSchema = z.object({
  currency: z.string(), // ISO 4217
  total: z.number(),
});

const MessageSchema = z.object({
  purchaseId: z.string(),
  sessionId: z.string().nullish(),
  amountUnit: z.enum(["MAJOR", "MINOR"]),
  errorMsg: z.string().nullish(),
  purchase: PurchaseSchema,
  brand_id: z.string(),
  status: z.string(),
});

export const PaysecureWebhookSchema = z.object({
  message: MessageSchema,
  status: z.string(), // duplicate of message.status
});

export type PaysecureWebhook = z.infer<typeof PaysecureWebhookSchema>;
