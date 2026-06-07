import type { FailedIntent } from "../../domain/entities";
import type {
  ListInput,
  ListOutput,
  ResolveInput,
  ReplayResult,
} from "../dto";

// FailedIntentRepoPort is the outbound interface the failedIntents module
// requires from its host. The HTTP adapter satisfies it for production,
// and an in-memory fake satisfies it for the use-case tests in this
// directory.
export interface FailedIntentRepoPort {
  list(input: ListInput, signal?: AbortSignal): Promise<ListOutput>;
  get(intentId: string, signal?: AbortSignal): Promise<FailedIntent>;
  replay(intentId: string): Promise<ReplayResult>;
  replayWith(intentId: string, body: unknown): Promise<ReplayResult>;
  resolve(input: ResolveInput): Promise<FailedIntent>;
}
