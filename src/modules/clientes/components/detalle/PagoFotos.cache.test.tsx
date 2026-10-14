import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AuthenticatedImage from "@/modules/ventasLocales/components/detalle/AuthenticatedImage";
import { ClientesProvider } from "../../presentation/context/ClientesContext";
import { FakeClientesPort, makeFakeImagenPago } from "../../application/__tests__/fakeClientesPort";
import { PagoFotos } from "./PagoFotos";

// Sin mock de AuthenticatedImage: se prueba la clave de caché real. Si otra
// imagen ya descargó "pago/<uuid>/<img>", la miniatura del pago la comparte en
// vez de pedirla otra vez; eso solo pasa si la clave es exactamente esa.
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:foto");
  URL.revokeObjectURL = vi.fn();
});

describe("PagoFotos: clave de caché pago/<pago_recibido_id>/<imagen>", () => {
  it("descarga por el puerto con el par (pago, imagen) correcto", async () => {
    const port = new FakeClientesPort();
    port.imagenesPagoResponse = [makeFakeImagenPago({ id: "img-a", descripcion: "Recibo" })];
    const descargar = vi.spyOn(port, "descargarImagenPago");
    render(
      <ClientesProvider port={port}>
        <PagoFotos pagoRecibidoId="p-1" />
      </ClientesProvider>,
    );
    expect(await screen.findByAltText("Recibo")).toHaveAttribute("src", "blob:foto");
    expect(descargar).toHaveBeenCalledWith("p-1", "img-a");
  });

  it("comparte la descarga con quien ya pidió la misma clave", async () => {
    const port = new FakeClientesPort();
    port.imagenesPagoResponse = [makeFakeImagenPago({ id: "img-b", descripcion: "Recibo B" })];
    const descargarPuerto = vi.spyOn(port, "descargarImagenPago");
    const descargarAjeno = vi.fn(async () => new Blob(["x"]));
    render(
      <ClientesProvider port={port}>
        <AuthenticatedImage fuente={{ cacheKey: "pago/p-2/img-b", descargar: descargarAjeno }} alt="ajena" />
        <PagoFotos pagoRecibidoId="p-2" />
      </ClientesProvider>,
    );
    expect(await screen.findByAltText("Recibo B")).toBeInTheDocument();
    await waitFor(() => expect(descargarAjeno).toHaveBeenCalledTimes(1));
    expect(descargarPuerto).not.toHaveBeenCalled();
  });
});
