import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { BandejaPort } from "../../application/ports/BandejaPort";

type BandejaContextValue = {
  port: BandejaPort;
  selectedClienteId: number | null;
  setSelectedClienteId: (clienteId: number | null) => void;
};

const BandejaContext = createContext<BandejaContextValue | null>(null);

// BandejaProvider carries the port (data access) plus the cross-panel
// selection state (which cliente's conversation is open) — both the queue
// column and the conversation/ficha columns read from here.
export function BandejaProvider({
  port,
  children,
}: {
  port: BandejaPort;
  children: ReactNode;
}) {
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);

  const value = useMemo(
    () => ({ port, selectedClienteId, setSelectedClienteId }),
    [port, selectedClienteId],
  );

  return <BandejaContext.Provider value={value}>{children}</BandejaContext.Provider>;
}

export function useBandeja(): BandejaContextValue {
  const ctx = useContext(BandejaContext);
  if (!ctx) {
    throw new Error("useBandeja must be used within BandejaProvider");
  }
  return ctx;
}
