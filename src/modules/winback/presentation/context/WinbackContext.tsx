import { createContext, useContext, type ReactNode } from "react";
import type { WinbackAnalyticsPort } from "../../application/ports/WinbackAnalyticsPort";

type WinbackContextValue = {
  port: WinbackAnalyticsPort;
};

const WinbackContext = createContext<WinbackContextValue | null>(null);

export function WinbackProvider({
  port,
  children,
}: {
  port: WinbackAnalyticsPort;
  children: ReactNode;
}) {
  return (
    <WinbackContext.Provider value={{ port }}>
      {children}
    </WinbackContext.Provider>
  );
}

export function useWinbackPort(): WinbackAnalyticsPort {
  const ctx = useContext(WinbackContext);
  if (!ctx) {
    throw new Error(
      "useWinbackPort: missing <WinbackProvider> — wrap the tree at the module entry point",
    );
  }
  return ctx.port;
}
