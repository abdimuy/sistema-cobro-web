import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AxiosError } from "axios";
import { GaleriaFotos } from "../GaleriaFotos";
import { CeldaFotos } from "../CeldaFotos";
import { ModalActividadDetalle } from "../ModalActividadDetalle";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import { FakeDesempenoPort, makeActividadVisita } from "../../../application/__tests__/fakeDesempenoPort";
import { apperrorToDomainError } from "../../../infrastructure/mappers/errorMapper";
import {
  error403Huma,
  error403PermisoDenegado,
  error500,
  errorDeRed,
} from "@/lib/__tests__/erroresHttpDePrueba";

vi.mock("@/modules/ventasLocales/components/detalle/AuthenticatedImage", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? "imagen"} />,
}));

const SIN_PERMISO = "No tienes permiso para ver las fotos";
const GENERICO = "No se pudieron cargar las fotos";

// El puerto falla como lo haría HttpDesempenoAdapter: con el error de axios
// pasado por el mapper real del módulo.
function puertoQueFalla(err: AxiosError) {
  const port = new FakeDesempenoPort();
  port.throwOnNext.listarImagenes = apperrorToDomainError(err);
  return port;
}

const casos: Array<[string, () => AxiosError, string, string]> = [
  ["403 de Huma (sin desempeno:ver)", error403Huma, SIN_PERMISO, GENERICO],
  ["403 code=permiso_denegado", error403PermisoDenegado, SIN_PERMISO, GENERICO],
  ["500", error500, GENERICO, SIN_PERMISO],
  ["sin red", errorDeRed, GENERICO, SIN_PERMISO],
];

describe.each(casos)("fotos de desempeño · %s", (_nombre, crearError, esperado, ausente) => {
  it("GaleriaFotos", async () => {
    renderConDesempeno(
      <GaleriaFotos refImagenes={{ tipo: "visita", visitaId: "v-1" }} mensajeSinFotos="No se tomaron fotos" />,
      { port: puertoQueFalla(crearError()) },
    );
    expect(await screen.findByText(esperado)).toBeInTheDocument();
    expect(screen.queryByText(ausente)).not.toBeInTheDocument();
  });

  it("CeldaFotos (popover)", async () => {
    const user = userEvent.setup();
    renderConDesempeno(<CeldaFotos actividad={makeActividadVisita()} />, { port: puertoQueFalla(crearError()) });
    await user.hover(screen.getByText("2"));
    expect(await screen.findByText(esperado)).toBeInTheDocument();
    expect(screen.queryByText(ausente)).not.toBeInTheDocument();
  });

  it("ModalActividadDetalle", async () => {
    renderConDesempeno(<ModalActividadDetalle actividad={makeActividadVisita()} onClose={vi.fn()} onAbrirCliente={vi.fn()} />, {
      port: puertoQueFalla(crearError()),
    });
    expect(await screen.findByText(esperado)).toBeInTheDocument();
    expect(screen.queryByText(ausente)).not.toBeInTheDocument();
  });
});
