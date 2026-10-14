import { useContext } from "react";
import type { DesempenoPort } from "../../application/ports/DesempenoPort";
import { DesempenoContext } from "./contextos";

export function useDesempenoPort(): DesempenoPort {
  const ctx = useContext(DesempenoContext);
  if (!ctx) {
    throw new Error(
      "useDesempenoPort: falta <DesempenoProvider> — envuelve el árbol en la entrada del módulo",
    );
  }
  return ctx.port;
}
