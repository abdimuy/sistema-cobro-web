import { useMemo, type ReactNode } from "react";
import { apiClient } from "../../infrastructure/http/apiClient";
import { HttpClientesAdapter } from "../../infrastructure/http/HttpClientesAdapter";
import { ClientesProvider } from "../context/ClientesContext";

// ClientesContainer is the module's composition root. It instantiates
// the HTTP adapter once and exposes it to the subtree via context.
//
// The screen wraps its top-level component in this so each hook can read
// the port from context — tests bypass the container and use the
// Provider directly with a fake.
export function ClientesContainer({ children }: { children: ReactNode }) {
  const port = useMemo(
    () => new HttpClientesAdapter(apiClient),
    [],
  );
  return <ClientesProvider port={port}>{children}</ClientesProvider>;
}
