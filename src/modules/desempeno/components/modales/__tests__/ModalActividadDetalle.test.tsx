import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModalActividadDetalle } from "../ModalActividadDetalle";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import { makeActividadPago, makeActividadVisita, makeRegistradoPor } from "../../../application/__tests__/fakeDesempenoPort";

vi.mock("@/modules/ventasLocales/components/detalle/AuthenticatedImage", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? "imagen"} />,
}));

describe("ModalActividadDetalle", () => {
  it("visita: resultado, nota, sin ubicación, horas de captura y llegada en la oficina, fotos", async () => {
    const user = userEvent.setup();
    const onAbrirCliente = vi.fn();
    renderConDesempeno(
      <ModalActividadDetalle actividad={makeActividadVisita()} onClose={vi.fn()} onAbrirCliente={onAbrirCliente} />,
    );
    expect(screen.getByText("Visitas")).toBeInTheDocument();
    expect(screen.getAllByText("No se encontraba").length).toBeGreaterThan(0);
    expect(screen.getByText("“Vecina dice que regresa el lunes”")).toBeInTheDocument();
    expect(screen.getByText("El teléfono no mandó ubicación.")).toBeInTheDocument();
    expect(screen.getByText("08:45")).toBeInTheDocument();
    expect(screen.getByText("10:58")).toBeInTheDocument();
    expect(screen.getByText("Fotos · 2")).toBeInTheDocument();
    expect(await screen.findByAltText("Recibo firmado")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ficha del cliente" }));
    expect(onAbrirCliente).toHaveBeenCalledWith(1602231);
  });

  it("visita: etiqueta del teléfono y captura tardía tal como las manda el servidor (contrato v2)", () => {
    renderConDesempeno(
      <ModalActividadDetalle actividad={makeActividadVisita()} onClose={vi.fn()} onAbrirCliente={vi.fn()} />,
    );
    expect(screen.getByText("No estaba")).toBeInTheDocument();
    expect(screen.getByText("Captura tardía")).toBeInTheDocument();
  });

  it("sin captura tardía no hay aviso", () => {
    renderConDesempeno(
      <ModalActividadDetalle actividad={makeActividadVisita({ capturaTardia: false })} onClose={vi.fn()} onAbrirCliente={vi.fn()} />,
    );
    expect(screen.queryByText("Captura tardía")).not.toBeInTheDocument();
  });

  it("pago que aún no llega a Microsip: importe, forma, estado y dónde se registró", () => {
    const base = makeActividadPago();
    renderConDesempeno(
      <ModalActividadDetalle
        actividad={{ ...base, pago: { ...base.pago!, doctoCcId: null, aplicado: false } }}
        onClose={vi.fn()}
        onAbrirCliente={vi.fn()}
      />,
    );
    expect(screen.getByText("Pagos")).toBeInTheDocument();
    expect(screen.getByText("$150.00")).toBeInTheDocument();
    expect(screen.getByText("Sin aplicar")).toBeInTheDocument();
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getByText("18.4617, -97.3928")).toBeInTheDocument();
    expect(screen.queryByText(/Depósito|Casa/)).not.toBeInTheDocument();
  });

  it("pago capturado en oficina sin ubicación lo dice así", () => {
    const base = makeActividadPago();
    renderConDesempeno(
      <ModalActividadDetalle
        actividad={{
          ...base,
          lat: null,
          lng: null,
          conGps: false,
          registradoPor: makeRegistradoPor({ origen: "oficina", nombre: "Oficina", usuarioUid: null, cobradorId: null }),
          pago: { ...base.pago!, doctoCcId: null, pagoRecibidoId: null },
        }}
        onClose={vi.fn()}
        onAbrirCliente={vi.fn()}
      />,
    );
    expect(screen.getByText("Capturado en oficina, sin ubicación.")).toBeInTheDocument();
    expect(screen.getByText("Sin comprobante")).toBeInTheDocument();
  });

  it("con docto_pv_id y onAbrirVenta ofrece el detalle de venta; sin docto_pv_id no", async () => {
    const user = userEvent.setup();
    const onAbrirVenta = vi.fn();
    const { unmount } = renderConDesempeno(
      <ModalActividadDetalle
        actividad={makeActividadVisita()}
        onClose={vi.fn()}
        onAbrirCliente={vi.fn()}
        onAbrirVenta={onAbrirVenta}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Detalle de venta" }));
    expect(onAbrirVenta).toHaveBeenCalledWith(1602231, 9934);
    unmount();
    renderConDesempeno(
      <ModalActividadDetalle
        actividad={makeActividadVisita({ doctoPvId: null })}
        onClose={vi.fn()}
        onAbrirCliente={vi.fn()}
        onAbrirVenta={onAbrirVenta}
      />,
    );
    expect(screen.queryByRole("button", { name: "Detalle de venta" })).not.toBeInTheDocument();
  });
});
