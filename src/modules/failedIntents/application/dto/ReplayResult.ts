import type { ReplayOutcome } from "../../domain/values";

export type ReplayResult = {
  outcome: ReplayOutcome;
  replayHttpStatus: number;
  replayBodyPreview: string;
};
