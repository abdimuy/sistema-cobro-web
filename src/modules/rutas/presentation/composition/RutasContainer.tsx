import { useMemo, type ReactNode } from "react";
import { apiClient } from "../../infrastructure/http/apiClient";
import { HttpRutasAdapter } from "../../infrastructure/http/HttpRutasAdapter";
import { RutasProvider } from "../context/RutasContext";

// RutasContainer is the module's composition root. It instantiates
// the HTTP adapter once and exposes it to the subtree via context.
//
// The screen wraps its top-level component in this so each hook can read
// the port from context — tests bypass the container and use the
// Provider directly with a fake.
export function RutasContainer({ children }: { children: ReactNode }) {
  const port = useMemo(() => new HttpRutasAdapter(apiClient), []);
  return <RutasProvider port={port}>{children}</RutasProvider>;
}
