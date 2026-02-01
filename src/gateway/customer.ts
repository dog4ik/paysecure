import { z } from "zod";

export type CreateCustomerPayload = {
  merchantCustomerId: string;
  fullName?: string | null;
  emailId?: string | null;
  dateOfBirth?: string | null;
  phoneNo?: string | null;
  city?: string | null;
  stateCode?: string | null;
  zipCode?: string | null;
  address?: string | null;
  country?: string | null;
  custRegDate?: string | null;
  successTxn?: string | null;
};

export const CustomerCreateResponseSchema = z.object({
  customerId: z.string(),
});

export type GetCustomerPayload = {
  merchantCustomerId: string;
};

export const GetCustomerResponseSchema = z.object({
  customerId: z.string(),
});
