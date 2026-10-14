import { useMemo, type ReactNode } from "react";
import { apiClient } from "../../infrastructure/http/apiClient";
import { HttpDesempenoAdapter } from "../../infrastructure/http/HttpDesempenoAdapter";
import { DesempenoProvider } from "../context/DesempenoProvider";

// Raíz de composición: el adapter HTTP real una sola vez para todo el subárbol.
// Las pruebas usan DesempenoProvider con FakeDesempenoPort.
export function DesempenoContainer({ children }: { children: ReactNode }) {
  const port = useMemo(() => new HttpDesempenoAdapter(apiClient), []);
  return <DesempenoProvider port={port}>{children}</DesempenoProvider>;
}
