import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { DesempenoProvider } from "../presentation/context/DesempenoProvider";
import type { PreferenciasDesempeno } from "../presentation/preferencias";
import { FakeDesempenoPort } from "../application/__tests__/fakeDesempenoPort";

// renderConDesempeno monta `ui` con router en memoria y el provider del
// módulo sobre un FakeDesempenoPort. Devuelve el puerto para inspeccionarlo.
export function renderConDesempeno(
  ui: ReactElement,
  opciones: {
    port?: FakeDesempenoPort;
    ruta?: string;
    preferencias?: Partial<PreferenciasDesempeno>;
  } = {},
) {
  const port = opciones.port ?? new FakeDesempenoPort();
  const resultado = render(
    <MemoryRouter initialEntries={[opciones.ruta ?? "/"]}>
      <DesempenoProvider port={port} preferenciasIniciales={opciones.preferencias}>
        {ui}
      </DesempenoProvider>
    </MemoryRouter>,
  );
  return { ...resultado, port };
}
