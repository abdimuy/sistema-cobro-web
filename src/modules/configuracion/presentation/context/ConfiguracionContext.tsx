import { createContext, useContext, type ReactNode } from "react";
import type { ConfiguracionPort } from "../../application/ports/ConfiguracionPort";

type ConfiguracionContextValue = {
  port: ConfiguracionPort;
};

const ConfiguracionContext = createContext<ConfiguracionContextValue | null>(null);

export function ConfiguracionProvider({
  port,
  children,
}: {
  port: ConfiguracionPort;
  children: ReactNode;
}) {
  return (
    <ConfiguracionContext.Provider value={{ port }}>
      {children}
    </ConfiguracionContext.Provider>
  );
}

export function useConfiguracionPort(): ConfiguracionPort {
  const ctx = useContext(ConfiguracionContext);
  if (!ctx) {
    throw new Error(
      "useConfiguracionPort: missing <ConfiguracionProvider> — wrap the tree at the module entry point",
    );
  }
  return ctx.port;
}
