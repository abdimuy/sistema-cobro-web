import { createContext, useContext, type ReactNode } from "react";
import type { UsuariosRolesPort } from "../../application/ports/UsuariosRolesPort";

type UsuariosRolesContextValue = {
  port: UsuariosRolesPort;
};

const UsuariosRolesContext = createContext<UsuariosRolesContextValue | null>(null);

export function UsuariosRolesProvider({
  port,
  children,
}: {
  port: UsuariosRolesPort;
  children: ReactNode;
}) {
  return (
    <UsuariosRolesContext.Provider value={{ port }}>
      {children}
    </UsuariosRolesContext.Provider>
  );
}

export function useUsuariosRolesPort(): UsuariosRolesPort {
  const ctx = useContext(UsuariosRolesContext);
  if (!ctx) {
    throw new Error(
      "useUsuariosRolesPort: missing <UsuariosRolesProvider> — wrap the tree at the module entry point",
    );
  }
  return ctx.port;
}
