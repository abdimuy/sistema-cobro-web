import { createContext, useContext, type ReactNode } from "react";
import type { ClientesPort } from "../../application/ports/ClientesPort";

type ClientesContextValue = {
  port: ClientesPort;
};

const ClientesContext = createContext<ClientesContextValue | null>(null);

export function ClientesProvider({
  port,
  children,
}: {
  port: ClientesPort;
  children: ReactNode;
}) {
  return (
    <ClientesContext.Provider value={{ port }}>
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientesPort(): ClientesPort {
  const ctx = useContext(ClientesContext);
  if (!ctx) {
    throw new Error(
      "useClientesPort: missing <ClientesProvider> — wrap the tree at the module entry point",
    );
  }
  return ctx.port;
}
