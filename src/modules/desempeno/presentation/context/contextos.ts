import { createContext } from "react";
import type { DesempenoPort } from "../../application/ports/DesempenoPort";
import type { ValorPreferencias } from "../preferencias";

export const DesempenoContext = createContext<{ port: DesempenoPort } | null>(null);
export const PreferenciasContext = createContext<ValorPreferencias | null>(null);
