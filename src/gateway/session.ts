import { z } from "zod";

export type CreateSessionRequest = {
  customerId: string;
  merchantRef?: string;
  currency: string; // ISO 4217
  products: {
    name: string;
    price: string; // kept as string per API
  }[];
  totalAmount?: string; // takes precedence over sum of product prices
  paymentMethod?: string;
  success_redirect: string;
  failure_redirect: string;
  pending_redirect: string;
  success_callback: string;
  failure_callback: string;
  extraParam?: Record<string, string>;
};

export const PaymentSessionResponseSchema = z.object({
  sessionUrl: z.url(),
  brandId: z.string(),
  customerId: z.string(),
  sessionId: z.string(),
});
