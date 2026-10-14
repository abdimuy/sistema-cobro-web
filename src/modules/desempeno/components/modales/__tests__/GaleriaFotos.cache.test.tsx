import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import AuthenticatedImage from "@/modules/ventasLocales/components/detalle/AuthenticatedImage";
import { GaleriaFotos } from "../GaleriaFotos";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import { FakeDesempenoPort, makeImagen } from "../../../application/__tests__/fakeDesempenoPort";

// Sin mock de AuthenticatedImage: la clave real es "<pago|visita>/<id>/<imagen>".
// Una visita y un pago con la misma imagen no deben compartir descarga, y una
// clave idéntica pedida por otro componente sí.
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:foto");
  URL.revokeObjectURL = vi.fn();
});

describe("GaleriaFotos: clave de caché con prefijo del recurso", () => {
  it("visita y pago con el mismo id de imagen descargan cada uno lo suyo", async () => {
    const port = new FakeDesempenoPort();
    port.imagenesResponse = [makeImagen({ id: "img-x", descripcion: "Foto" })];
    renderConDesempeno(
      <>
        <GaleriaFotos refImagenes={{ tipo: "visita", visitaId: "id-1" }} mensajeSinFotos="—" />
        <GaleriaFotos refImagenes={{ tipo: "pago", pagoRecibidoId: "id-1" }} mensajeSinFotos="—" />
      </>,
      { port },
    );
    await waitFor(() => expect(port.descargarCalls).toHaveLength(2));
    expect(port.descargarCalls).toEqual(
      expect.arrayContaining([
        { ref: { tipo: "visita", visitaId: "id-1" }, imagenId: "img-x" },
        { ref: { tipo: "pago", pagoRecibidoId: "id-1" }, imagenId: "img-x" },
      ]),
    );
  });

  it.each([
    ["visita/v-9/img-y", { tipo: "visita", visitaId: "v-9" } as const],
    ["pago/p-9/img-y", { tipo: "pago", pagoRecibidoId: "p-9" } as const],
  ])("comparte la descarga con quien ya pidió %s", async (clave, ref) => {
    const port = new FakeDesempenoPort();
    port.imagenesResponse = [makeImagen({ id: "img-y", descripcion: "Compartida" })];
    const ajeno = vi.fn(async () => new Blob(["x"]));
    renderConDesempeno(
      <>
        <AuthenticatedImage fuente={{ cacheKey: clave, descargar: ajeno }} alt="ajena" />
        <GaleriaFotos refImagenes={ref} mensajeSinFotos="—" />
      </>,
      { port },
    );
    expect(await screen.findByAltText("Compartida")).toBeInTheDocument();
    await waitFor(() => expect(ajeno).toHaveBeenCalledTimes(1));
    expect(port.descargarCalls).toHaveLength(0);
  });
});
