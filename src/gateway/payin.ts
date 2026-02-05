import { z } from "zod";

export type CreatePaymentParams = {
  client?: {
    full_name?: string | null;
    email?: string;

    country?: string | null;
    stateCode?: string | null;
    street_address?: string | null;
    city?: string | null;
    zip_code?: string | null;
    phone?: string | null;
  };

  /**
   * Conditional.
   * Mandatory if you are NOT using Paysecure Cashier.
   */
  paymentMethod: string;

  purchase: {
    /**
     * Mandatory.
     * ISO 4217 currency code.
     * Must be "BRL" for PIX.
     */
    currency: string;

    /**
     * Mandatory.
     */
    products: Array<{
      /**
       * Mandatory.
       */
      name: string;

      /**
       * Mandatory.
       * Decimal with up to 2 decimal places (e.g. 5.00, 10.37)
       */
      price: number;
    }>;
  };

  /**
   * Mandatory.
   * Obtained from the merchant dashboard.
   */
  brand_id: string;

  /**
   * Mandatory.
   * Redirect URL when the transaction is successful.
   */
  success_redirect: string;

  pending_redirect: string;
  failure_redirect: string;
  success_callback: string;
  failure_callback: string;
};

const ProductSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
  discount: z.number(),
  tax_percent: z.string(),
});

const PurchaseSchema = z.object({
  currency: z.string(),
  products: z.array(ProductSchema),
  total: z.number(),
  requestAmount: z.number(),
  language: z.string(),
  notes: z.string(),
  debt: z.number(),
  total_formatted: z.number(),
  taxAmount: z.number(),
  taxPercent: z.number(),
  request_client_details: z.array(z.any()),
  email_message: z.string(),
});

export const PurchasePayloadSchema = z.object({
  purchaseId: z.string(),
  amountUnit: z.string(),
  errorMsg: z.string().nullish(),
  errorCode: z.string().nullish(),

  purchase: PurchaseSchema,

  status: z.string(),

  brand_id: z.string(),

  checkout_url: z.string(),
});
