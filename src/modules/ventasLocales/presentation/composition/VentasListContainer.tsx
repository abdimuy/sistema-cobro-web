import { useMemo, type ReactNode } from "react";
import { apiClient } from "../../infrastructure/http/apiClient";
import { HttpVentasListAdapter } from "../../infrastructure/http/HttpVentasListAdapter";
import { VentasListProvider } from "../context/VentasListContext";

// VentasListContainer is the search/list slice's composition root. It
// instantiates the HTTP adapter once and exposes it to the subtree via
// context — mirrors ClientesContainer.
//
// Tests bypass this container and use VentasListProvider directly with a
// fake port.
export function VentasListContainer({ children }: { children: ReactNode }) {
  const port = useMemo(() => new HttpVentasListAdapter(apiClient), []);
  return <VentasListProvider port={port}>{children}</VentasListProvider>;
}
