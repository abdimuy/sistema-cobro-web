import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GaleriaFotos } from "../GaleriaFotos";
import { CeldaFotos } from "../CeldaFotos";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import {
  FakeDesempenoPort,
  makeActividadPago,
  makeActividadVisita,
  makeImagen,
} from "../../../application/__tests__/fakeDesempenoPort";

vi.mock("@/modules/ventasLocales/components/detalle/AuthenticatedImage", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? "imagen"} />,
}));

describe("GaleriaFotos", () => {
  it("sin referencia dice por qué no hay fotos", () => {
    renderConDesempeno(<GaleriaFotos refImagenes={null} mensajeSinFotos="Sin comprobante" />);
    expect(screen.getByText("Sin comprobante")).toBeInTheDocument();
  });

  it("pide las fotos de la visita y abre el visor", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    port.imagenesResponse = [makeImagen({ id: "a", descripcion: "Fachada" }), makeImagen({ id: "b", descripcion: "Puerta" })];
    renderConDesempeno(
      <GaleriaFotos refImagenes={{ tipo: "visita", visitaId: "v-1" }} mensajeSinFotos="No se tomaron fotos" />,
      { port },
    );
    await user.click(await screen.findByRole("button", { name: "Ver Fachada" }));
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(port.imagenesCalls[0].ref).toEqual({ tipo: "visita", visitaId: "v-1" });
  });

  it("si la lista falla lo dice sin tumbar la pantalla", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.listarImagenes = new Error("503");
    renderConDesempeno(
      <GaleriaFotos refImagenes={{ tipo: "pago", pagoRecibidoId: "p-1" }} mensajeSinFotos="No se tomaron fotos" />,
      { port },
    );
    expect(await screen.findByText("No se pudieron cargar las fotos")).toBeInTheDocument();
  });
});

describe("CeldaFotos", () => {
  it("sin fotos, guion", () => {
    renderConDesempeno(<CeldaFotos actividad={makeActividadPago({ numFotos: 0 })} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("popover con miniaturas que solo se piden al abrirlo", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    renderConDesempeno(<CeldaFotos actividad={makeActividadVisita()} />, { port });
    expect(port.imagenesCalls).toHaveLength(0);
    await user.hover(screen.getByText("2"));
    expect(await screen.findByText("2 fotos")).toBeInTheDocument();
    expect(await screen.findByAltText("Recibo firmado")).toBeInTheDocument();
    expect(port.imagenesCalls).toHaveLength(1);
  });
});
