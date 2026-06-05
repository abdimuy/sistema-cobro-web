import { useCallback, useState } from "react";
import { guardarEdicionVenta } from "../../application/usecases/guardarEdicionVenta";
import type { EdicionVentaInput } from "../../application/dto/EdicionVentaInput";
import type { EdicionVentaResult } from "../../application/dto/EdicionVentaResult";
import { ventasLocalesContainer } from "../composition/ventasLocalesContainer";

export type GuardarEdicionState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "done"; result: EdicionVentaResult };

export function useGuardarEdicionVenta() {
  const [state, setState] = useState<GuardarEdicionState>({ status: "idle" });

  const guardar = useCallback(
    async (input: EdicionVentaInput): Promise<EdicionVentaResult> => {
      setState({ status: "saving" });
      const result = await guardarEdicionVenta(
        { port: ventasLocalesContainer.port },
        input,
      );
      setState({ status: "done", result });
      return result;
    },
    [],
  );

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return {
    saving: state.status === "saving",
    result: state.status === "done" ? state.result : null,
    guardar,
    reset,
  };
}
