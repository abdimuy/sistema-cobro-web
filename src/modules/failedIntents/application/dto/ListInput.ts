import type { IntentStatusValue } from "../../domain/values";

export type ListInput = {
  status?: IntentStatusValue;
  cursor?: string;
  pageSize?: number;
};
