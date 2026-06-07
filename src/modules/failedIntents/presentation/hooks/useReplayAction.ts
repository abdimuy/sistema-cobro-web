import { useCallback, useRef, useState } from "react";
import type { FailedIntent, Manifest } from "../../domain/entities";
import type { ReplayResult, UploadMap } from "../../application/dto";
import { useFailedIntentsPort } from "../context/FailedIntentsContext";
import { replayIntent } from "../../application/usecases/replayIntent";
import { replayConBodyEditado } from "../../application/usecases/replayConBodyEditado";
import { replayConMultipartEditado } from "../../application/usecases/replayConMultipartEditado";
import { DomainError } from "../../domain/errors";

export type ReplayActionState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; result: ReplayResult }
  | { status: "error"; error: DomainError };

export type UseReplayActionReturn = {
  state: ReplayActionState;
  replay: (intentId: string) => Promise<ReplayResult | null>;
  replayWith: (
    intent: FailedIntent,
    body: unknown,
  ) => Promise<ReplayResult | null>;
  replayWithMultipart: (
    intent: FailedIntent,
    manifest: Manifest,
    uploads: UploadMap,
  ) => Promise<ReplayResult | null>;
  reset: () => void;
};

// useReplayAction owns the lifecycle of a single replay action — either
// plain replay or replay-with corrections. While a request is in
// flight, repeated triggers are dropped (returns the previous pending
// promise's resolution path of `null`) so the UI never double-sends.
export function useReplayAction(): UseReplayActionReturn {
  const port = useFailedIntentsPort();
  const [state, setState] = useState<ReplayActionState>({ status: "idle" });
  const pendingRef = useRef(false);

  const replay = useCallback(
    async (intentId: string): Promise<ReplayResult | null> => {
      if (pendingRef.current) return null;
      pendingRef.current = true;
      setState({ status: "pending" });
      try {
        const result = await replayIntent(port, intentId);
        setState({ status: "success", result });
        return result;
      } catch (e) {
        const err =
          e instanceof DomainError
            ? e
            : new DomainError("error_inesperado", String(e));
        setState({ status: "error", error: err });
        return null;
      } finally {
        pendingRef.current = false;
      }
    },
    [port],
  );

  const replayWith = useCallback(
    async (
      intent: FailedIntent,
      body: unknown,
    ): Promise<ReplayResult | null> => {
      if (pendingRef.current) return null;
      pendingRef.current = true;
      setState({ status: "pending" });
      try {
        const result = await replayConBodyEditado(port, intent, body);
        setState({ status: "success", result });
        return result;
      } catch (e) {
        const err =
          e instanceof DomainError
            ? e
            : new DomainError("error_inesperado", String(e));
        setState({ status: "error", error: err });
        return null;
      } finally {
        pendingRef.current = false;
      }
    },
    [port],
  );

  const replayWithMultipart = useCallback(
    async (
      intent: FailedIntent,
      manifest: Manifest,
      uploads: UploadMap,
    ): Promise<ReplayResult | null> => {
      if (pendingRef.current) return null;
      pendingRef.current = true;
      setState({ status: "pending" });
      try {
        const result = await replayConMultipartEditado(
          port,
          intent,
          manifest,
          uploads,
        );
        setState({ status: "success", result });
        return result;
      } catch (e) {
        const err =
          e instanceof DomainError
            ? e
            : new DomainError("error_inesperado", String(e));
        setState({ status: "error", error: err });
        return null;
      } finally {
        pendingRef.current = false;
      }
    },
    [port],
  );

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return { state, replay, replayWith, replayWithMultipart, reset };
}
