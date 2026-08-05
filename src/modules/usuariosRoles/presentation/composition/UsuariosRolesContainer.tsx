import { useMemo, type ReactNode } from "react";
import { apiClient } from "../../infrastructure/http/apiClient";
import { HttpUsuariosRolesAdapter } from "../../infrastructure/http/HttpUsuariosRolesAdapter";
import { UsuariosRolesProvider } from "../context/UsuariosRolesContext";

// UsuariosRolesContainer is the module's composition root. It instantiates
// the HTTP adapter once and exposes it to the subtree via context.
//
// The host wraps its content in this so each hook can read the port from
// context — tests bypass the container and use the Provider directly with
// a fake.
export function UsuariosRolesContainer({ children }: { children: ReactNode }) {
  const port = useMemo(() => new HttpUsuariosRolesAdapter(apiClient), []);
  return <UsuariosRolesProvider port={port}>{children}</UsuariosRolesProvider>;
}
