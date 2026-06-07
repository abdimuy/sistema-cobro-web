import { createContext, useContext, type ReactNode } from "react";
import type { FailedIntentRepoPort } from "../../application/ports/FailedIntentRepoPort";

type FailedIntentsContextValue = {
  port: FailedIntentRepoPort;
};

const FailedIntentsContext = createContext<FailedIntentsContextValue | null>(
  null,
);

export function FailedIntentsProvider({
  port,
  children,
}: {
  port: FailedIntentRepoPort;
  children: ReactNode;
}) {
  return (
    <FailedIntentsContext.Provider value={{ port }}>
      {children}
    </FailedIntentsContext.Provider>
  );
}

export function useFailedIntentsPort(): FailedIntentRepoPort {
  const ctx = useContext(FailedIntentsContext);
  if (!ctx) {
    throw new Error(
      "useFailedIntentsPort: missing <FailedIntentsProvider> — wrap the tree at the module entry point",
    );
  }
  return ctx.port;
}
