import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChipTrato } from "../ChipTrato";
import { MontoActividad } from "../MontoActividad";
import { TarjetaActividad } from "../TarjetaActividad";
import { ErrorConReintento, EstadoVacio } from "../Estados";
import { SegmentoPeriodo } from "../SegmentoPeriodo";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import {
  makeActividadCondonacion,
  makeActividadPago,
  makeActividadVisita,
} from "../../../application/__tests__/fakeDesempenoPort";

describe("ChipTrato", () => {
  it("pinta la etiqueta del servidor con ícono (nunca color solo)", () => {
    const { container } = render(<ChipTrato trato="escalar" etiqueta="Se negó" />);
    expect(screen.getByText("Se negó")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("[data-trato='escalar']")).not.toBeNull();
  });
});

describe("MontoActividad", () => {
  it("pago, condonación y visita", () => {
    const { rerender } = render(<MontoActividad actividad={makeActividadPago()} />);
    expect(screen.getByText("$150")).toBeInTheDocument();

    rerender(<MontoActividad actividad={makeActividadCondonacion()} />);
    expect(screen.getByText("−$50")).toBeInTheDocument();

    rerender(<MontoActividad actividad={makeActividadVisita()} />);
    expect(screen.getByText("No se encontraba")).toBeInTheDocument();
  });

  it("una visita se pinta con el trato que manda el servidor (contrato v2), no con uno derivado", () => {
    const { container } = render(<MontoActividad actividad={makeActividadVisita()} />);
    expect(container.querySelector("[data-trato='nadie']")).not.toBeNull();

    const base = makeActividadVisita();
    const otra = { ...base, visita: { ...base.visita!, trato: "escalar" as const } };
    const { container: c2 } = render(<MontoActividad actividad={otra} />);
    expect(c2.querySelector("[data-trato='escalar']")).not.toBeNull();
  });

  it("un pago rechazado o sin aplicar se muestra con su estado real (spec §6)", () => {
    const base = makeActividadPago();
    const { rerender } = render(
      <MontoActividad actividad={{ ...base, pago: { ...base.pago!, rechazado: true } }} />,
    );
    expect(screen.getByText("Rechazado")).toBeInTheDocument();

    rerender(<MontoActividad actividad={{ ...base, pago: { ...base.pago!, aplicado: false } }} />);
    expect(screen.getByText("Sin aplicar")).toBeInTheDocument();
  });
});

describe("TarjetaActividad", () => {
  it("resume un pago con hora de la oficina y sin 'Depósito'", () => {
    render(<TarjetaActividad actividad={makeActividadPago()} />);
    expect(screen.getByText("Pago · $150")).toBeInTheDocument();
    // Registrado 14:20:00Z y recibido 14:20:05Z: los dos caen en 08:20 de la
    // oficina (subtítulo y renglón "Llegó").
    expect(screen.getAllByText("mié 14 oct 08:20")).toHaveLength(2);
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getByText("JUAN CARLOS MENDEZ")).toBeInTheDocument();
    expect(screen.queryByText(/Depósito/)).not.toBeInTheDocument();
    expect(screen.queryByText(/tarde/)).not.toBeInTheDocument();
  });

  it("una visita muestra resultado, nota y que no trae ubicación", () => {
    render(<TarjetaActividad actividad={makeActividadVisita()} />);
    expect(screen.getByText("Visita · No se encontraba")).toBeInTheDocument();
    expect(screen.getByText("sin ubicación")).toBeInTheDocument();
    expect(screen.getByText("“Vecina dice que regresa el lunes”")).toBeInTheDocument();
  });

  it("una visita muestra la etiqueta del servidor y la captura tardía que marcó el servidor", () => {
    render(<TarjetaActividad actividad={makeActividadVisita()} />);
    expect(screen.getByText("No estaba")).toBeInTheDocument();
    // recibido 16:58Z = 10:58 en la oficina; captura_tardia viene del API.
    expect(screen.getByText("mié 14 oct 10:58 · tarde")).toBeInTheDocument();
  });
});

describe("SegmentoPeriodo", () => {
  it("abre en Hoy y cambia a Semana", async () => {
    const user = userEvent.setup();
    renderConDesempeno(<SegmentoPeriodo />);
    expect(screen.getByRole("button", { name: "Hoy" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Semana" }));
    expect(screen.getByRole("button", { name: "Semana" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("Estados", () => {
  it("error con Reintentar", async () => {
    const user = userEvent.setup();
    const onReintentar = vi.fn();
    render(
      <ErrorConReintento titulo="No se pudo cargar" mensaje="error de red" onReintentar={onReintentar} />,
    );
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });

  it("vacío", () => {
    render(<EstadoVacio titulo="Sin actividad hoy" detalle="Su último movimiento fue ayer." />);
    expect(screen.getByText("Sin actividad hoy")).toBeInTheDocument();
  });
});
