import { useCallback, useRef, useState } from "react";
import type { FailedIntent } from "../../domain/entities";
import type { ResolveInput } from "../../application/dto";
import { useFailedIntentsPort } from "../context/FailedIntentsContext";
import { resolverIntent } from "../../application/usecases/resolverIntent";
import { DomainError } from "../../domain/errors";

export type ResolverActionState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; intent: FailedIntent }
  | { status: "error"; error: DomainError };

export type UseResolverActionReturn = {
  state: ResolverActionState;
  resolve: (input: ResolveInput) => Promise<FailedIntent | null>;
  reset: () => void;
};

export function useResolverAction(): UseResolverActionReturn {
  const port = useFailedIntentsPort();
  const [state, setState] = useState<ResolverActionState>({ status: "idle" });
  const pendingRef = useRef(false);

  const resolve = useCallback(
    async (input: ResolveInput): Promise<FailedIntent | null> => {
      if (pendingRef.current) return null;
      pendingRef.current = true;
      setState({ status: "pending" });
      try {
        const intent = await resolverIntent(port, input);
        setState({ status: "success", intent });
        return intent;
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

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, resolve, reset };
}
