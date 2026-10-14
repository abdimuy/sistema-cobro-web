import { useContext } from "react";
import type { ValorPreferencias } from "../preferencias";
import { PreferenciasContext } from "./contextos";

export function usePreferencias(): ValorPreferencias {
  const v = useContext(PreferenciasContext);
  if (!v) {
    throw new Error("usePreferencias: falta <PreferenciasProvider> (lo pone <DesempenoProvider>)");
  }
  return v;
}
