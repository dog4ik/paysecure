import type { ValidationTargets } from "hono";
import { zValidator as zv } from "@hono/zod-validator";
import type { GwConnectError } from "./connect/error.js";
import type { ZodType } from "zod";

export const zValidator = <
  T extends ZodType,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
) =>
  zv(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({
        result: false,
        error: `Invalid gateway connect request: ${result.error.message}`,
        logs: [],
      } as GwConnectError);
    }
  });
