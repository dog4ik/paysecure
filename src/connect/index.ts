import { z } from "zod";

export type RedirectRequestType =
  | "post_iframes"
  | "get_with_processing"
  | "get"
  | "post"
  | "redirect_html";

const CommonSettingsFields = {
  api_key: z.string(),
  brand_id: z.string(),
};

export const PayinSettingsSchema = z.object({
  force_cashier: z.boolean().nullish(),
  assets_public_key: z.string(),
  ...CommonSettingsFields,
});

export const StatusSettingsSchema = z.object({
  ...CommonSettingsFields,
});

export type Settings =
  | z.infer<typeof PayinSettingsSchema>
  | z.infer<typeof StatusSettingsSchema>;

export type ConnectStatus = "approved" | "declined" | "pending";

export function normalizeExtraReturnParam(param: string | undefined | null) {
  if (!param || param === "_blank_") return undefined;
  return param;
}
