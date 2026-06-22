import { createContext, useContext, type ReactNode } from "react";
import type { RutasPort } from "../../application/ports/RutasPort";

type RutasContextValue = {
  port: RutasPort;
};

const RutasContext = createContext<RutasContextValue | null>(null);

export function RutasProvider({
  port,
  children,
}: {
  port: RutasPort;
  children: ReactNode;
}) {
  return (
    <RutasContext.Provider value={{ port }}>{children}</RutasContext.Provider>
  );
}

export function useRutasPort(): RutasPort {
  const ctx = useContext(RutasContext);
  if (!ctx) {
    throw new Error(
      "useRutasPort: missing <RutasProvider> — wrap the tree at the module entry point",
    );
  }
  return ctx.port;
}
