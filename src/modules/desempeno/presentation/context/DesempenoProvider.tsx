import { useMemo, type ReactNode } from "react";
import type { DesempenoPort } from "../../application/ports/DesempenoPort";
import type { PreferenciasDesempeno } from "../preferencias";
import { DesempenoContext } from "./contextos";
import { PreferenciasProvider } from "./PreferenciasProvider";

// DesempenoProvider entrega el puerto y las preferencias de la pantalla. El
// container de producción le pasa el adapter HTTP; las pruebas, el fake.
export function DesempenoProvider({
  port,
  preferenciasIniciales,
  children,
}: {
  port: DesempenoPort;
  preferenciasIniciales?: Partial<PreferenciasDesempeno>;
  children: ReactNode;
}) {
  const valor = useMemo(() => ({ port }), [port]);
  return (
    <DesempenoContext.Provider value={valor}>
      <PreferenciasProvider iniciales={preferenciasIniciales}>{children}</PreferenciasProvider>
    </DesempenoContext.Provider>
  );
}
