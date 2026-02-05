import { z } from "zod";
import { StatusSettingsSchema, type ConnectStatus } from "./index.js";
import { type InteractionLog } from "../interaction_logs.js";

export const StatusPaymentSchema = z.object({
  gateway_token: z.string(),
  token: z.string(),
});

export const StatusRequestSchema = z.object({
  payment: StatusPaymentSchema,
  settings: StatusSettingsSchema,
});

export type StatusRequest = z.infer<typeof StatusRequestSchema>;

export type ConnectStatusResponse = {
  result: boolean;
  logs: InteractionLog[];
  status: ConnectStatus;
  details: string;
  amount: number;
  currency: string;
};
