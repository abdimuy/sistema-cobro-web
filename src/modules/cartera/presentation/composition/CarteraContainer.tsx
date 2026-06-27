import { useMemo, type ReactNode } from "react";
import { apiClient } from "../../infrastructure/http/apiClient";
import { HttpCarteraAdapter } from "../../infrastructure/http/HttpCarteraAdapter";
import { CarteraProvider } from "../context/CarteraContext";

// CarteraContainer is the module's composition root. It instantiates
// the HTTP adapter once and exposes it to the subtree via context.
export function CarteraContainer({ children }: { children: ReactNode }) {
  const port = useMemo(
    () => new HttpCarteraAdapter(apiClient),
    [],
  );
  return <CarteraProvider port={port}>{children}</CarteraProvider>;
}
