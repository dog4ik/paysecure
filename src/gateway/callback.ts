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
  currency: z.string().length(3), // ISO 4217
  total: z.number(),
});

const PaymentSchema = z.object({
  payment_type: z.string(),
  amount: z.number(),
  currency: z.string(),
});

const MessageSchema = z.object({
  purchaseId: z.string(),
  type: z.string(),
  paymentMethod: z.string(), // comma-separated list
  amountUnit: z.enum(["MAJOR", "MINOR"]),
  errorMsg: z.string().optional(),
  created_on: z.number(),
  merchantRef: z.string(),
  merchantName: z.string(),
  purchase: PurchaseSchema,
  payment: PaymentSchema,
  status: z.string(),
  reference: z.string(),
});

export const PaysecureWebhookSchema = z.object({
  message: MessageSchema,
  status: z.string(), // duplicate of message.status
});
