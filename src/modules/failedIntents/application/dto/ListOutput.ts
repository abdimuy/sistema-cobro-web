import type { FailedIntent } from "../../domain/entities";

export type ListOutput = {
  items: ReadonlyArray<FailedIntent>;
  nextCursor: string | null;
  hasMore: boolean;
};
