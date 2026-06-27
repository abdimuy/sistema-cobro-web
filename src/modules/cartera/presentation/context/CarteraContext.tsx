import { createContext, useContext, type ReactNode } from "react";
import type { CarteraPort } from "../../application/ports/CarteraPort";

type CarteraContextValue = {
  port: CarteraPort;
};

const CarteraContext = createContext<CarteraContextValue | null>(null);

export function CarteraProvider({
  port,
  children,
}: {
  port: CarteraPort;
  children: ReactNode;
}) {
  return (
    <CarteraContext.Provider value={{ port }}>
      {children}
    </CarteraContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCarteraPort(): CarteraPort {
  const ctx = useContext(CarteraContext);
  if (!ctx) {
    throw new Error(
      "useCarteraPort: missing <CarteraProvider> — wrap the tree at the module entry point",
    );
  }
  return ctx.port;
}
