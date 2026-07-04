import { createContext, useContext, type ReactNode } from "react";
import type { VentasListPort } from "../../application/ports/VentasListPort";

type VentasListContextValue = {
  port: VentasListPort;
};

const VentasListContext = createContext<VentasListContextValue | null>(null);

export function VentasListProvider({
  port,
  children,
}: {
  port: VentasListPort;
  children: ReactNode;
}) {
  return (
    <VentasListContext.Provider value={{ port }}>
      {children}
    </VentasListContext.Provider>
  );
}

export function useVentasListPort(): VentasListPort {
  const ctx = useContext(VentasListContext);
  if (!ctx) {
    throw new Error(
      "useVentasListPort: missing <VentasListProvider> — wrap the tree at the module entry point",
    );
  }
  return ctx.port;
}
