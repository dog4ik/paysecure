import { z } from "zod";

export const RedirectRequestTypeSchema = z.enum([
  "post_iframes",
  "get_with_processing",
  "get",
  "post",
  "redirect_html",
]);

export type RedirectRequestType = z.infer<typeof RedirectRequestTypeSchema>;

export const SettingsSchema = z.object({
  method: z.string().nullish(),
  sandbox: z.boolean().nullish(),
  api_key: z.string(),
  brand_id: z.string(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export type ConnectStatus = "approved" | "declined" | "pending";

export function normalizeExtraReturnParam(param: string | undefined | null) {
  if (!param || param === "_blank_") return undefined;
  return param;
}
