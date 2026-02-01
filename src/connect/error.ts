import type { InteractionLog } from "../interaction_logs.js";

export type GwConnectError = {
  result: boolean;
  error: string;
  logs: InteractionLog[];
};
