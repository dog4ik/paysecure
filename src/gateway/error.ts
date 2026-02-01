import { z } from "zod";

export const ErrorSchema = z.object({
  message: z.string().nullish(),
  code: z.string().nullish(),
});

export class GatewayError extends Error {
  public gwMessage: string | undefined;
  public gwCode: string | undefined;

  constructor(error: z.infer<typeof ErrorSchema>) {
    super(`${error.message ?? ""} - ${error.code ?? ""}`);
    this.gwMessage = error.message ?? undefined;
    this.gwCode = error.code ?? undefined;
  }
}
