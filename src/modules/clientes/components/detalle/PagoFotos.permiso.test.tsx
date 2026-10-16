import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AxiosError } from "axios";
import { ClientesProvider } from "../../presentation/context/ClientesContext";
import { FakeClientesPort, makeFakePagoDetalle } from "../../application/__tests__/fakeClientesPort";
import { apperrorToDomainError } from "../../infrastructure/mappers/errorMapper";
import {
  error403Huma,
  error403PermisoDenegado,
  error500,
  errorDeRed,
} from "@/lib/__tests__/erroresHttpDePrueba";
import { PagoFotos } from "./PagoFotos";
import { PagoModal } from "./PagoModal";

vi.mock("../ficha/FichaMapEmbed", () => ({ FichaMapEmbed: () => <div data-testid="mock-map" /> }));
vi.mock("@/modules/ventasLocales/components/detalle/AuthenticatedImage", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? "imagen"} />,
}));

const SIN_PERMISO = "No tienes permiso para ver las fotos";
const GENERICO = "No se pudieron cargar las fotos";

// Igual que HttpClientesAdapter.listarImagenesPago: axios → mapper real.
function puertoQueFalla(err: AxiosError) {
  const port = new FakeClientesPort();
  port.obtenerPagoDetalleResponse = makeFakePagoDetalle({ pagoRecibidoId: "p-1", numFotos: 1 });
  port.throwOnNext.listarImagenesPago = apperrorToDomainError(err);
  return port;
}

const casos: Array<[string, () => AxiosError, string, string]> = [
  ["403 de Huma", error403Huma, SIN_PERMISO, GENERICO],
  ["403 code=permiso_denegado", error403PermisoDenegado, SIN_PERMISO, GENERICO],
  ["500", error500, GENERICO, SIN_PERMISO],
  ["sin red", errorDeRed, GENERICO, SIN_PERMISO],
];

describe.each(casos)("fotos del pago · %s", (_nombre, crearError, esperado, ausente) => {
  it("PagoFotos", async () => {
    render(
      <ClientesProvider port={puertoQueFalla(crearError())}>
        <PagoFotos pagoRecibidoId="p-1" />
      </ClientesProvider>,
    );
    expect(await screen.findByText(esperado)).toBeInTheDocument();
    expect(screen.queryByText(ausente)).not.toBeInTheDocument();
  });

  it("PagoModal", async () => {
    render(
      <ClientesProvider port={puertoQueFalla(crearError())}>
        <PagoModal clienteId={1544855} doctoCcId={15082369} onClose={vi.fn()} />
      </ClientesProvider>,
    );
    expect(await screen.findByText(esperado)).toBeInTheDocument();
    expect(screen.queryByText(ausente)).not.toBeInTheDocument();
    expect(screen.getByText("Quién cobró")).toBeInTheDocument();
  });
});
