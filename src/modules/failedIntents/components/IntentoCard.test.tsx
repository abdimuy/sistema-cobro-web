import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { IntentoCard } from "./IntentoCard";
import { agrupar } from "../domain/entities";
import { makeFakeIntent } from "../application/__tests__/fakeRepoPort";

const AHORA = new Date("2026-08-19T19:34:00.000Z");

function unaVenta(overrides = {}) {
  return agrupar([
    makeFakeIntent({
      id: "v1",
      idempotencyKey: "venta-77",
      path: "/v2/ventas",
      receivedAt: new Date("2026-08-19T13:20:00.000Z"),
      lastSeenAt: new Date("2026-08-19T19:30:00.000Z"),
      retryCount: 12,
      httpStatus: 422,
      errorCode: "articulo_sin_existencia",
      errorMessage: "sin existencia",
      body: {
        cliente: { nombre: "Carmen López Zavaleta" },
        tipo_venta: "CREDITO",
        montos: { corto_plazo: "10300.00", anual: "0", contado: "0" },
      },
      ...overrides,
    }),
  ])[0];
}

describe("IntentoCard", () => {
  it("una venta con trece intentos rinde UNA tarjeta que dice trece", () => {
    render(
      <IntentoCard
        intento={unaVenta()}
        seleccionado={false}
        onSeleccionar={() => {}}
        onAccion={() => {}}
        ahora={AHORA}
      />,
    );

    expect(screen.getAllByTestId(/^intento-card-/)).toHaveLength(1);
    expect(screen.getByText("13 intentos")).toBeInTheDocument();
  });

  it("dice quién, cuánto y desde cuándo", () => {
    render(
      <IntentoCard
        intento={unaVenta()}
        seleccionado={false}
        onSeleccionar={() => {}}
        onAccion={() => {}}
        ahora={AHORA}
      />,
    );

    expect(screen.getByText("Carmen López Zavaleta")).toBeInTheDocument();
    expect(screen.getByText(/10,300\.00/)).toBeInTheDocument();
    expect(screen.getByText(/desde hoy/)).toBeInTheDocument();
    expect(screen.getByText(/el último hace 4 minutos/)).toBeInTheDocument();
  });

  it("nunca muestra 'error desconocido'", () => {
    const sinCodigo = agrupar([
      makeFakeIntent({
        idempotencyKey: "k",
        httpStatus: 422,
        errorCode: null,
        errorMessage: "el nombre del cliente es obligatorio",
      }),
    ])[0];

    render(
      <IntentoCard
        intento={sinCodigo}
        seleccionado={false}
        onSeleccionar={() => {}}
        onAccion={() => {}}
        ahora={AHORA}
      />,
    );

    expect(screen.getByText("el nombre del cliente es obligatorio")).toBeInTheDocument();
    expect(screen.queryByText(/error desconocido/i)).toBeNull();
  });

  it("la acción primaria nombra lo que hizo la persona, no lo que hace el sistema", () => {
    const { rerender } = render(
      <IntentoCard
        intento={unaVenta()}
        seleccionado={false}
        onSeleccionar={() => {}}
        onAccion={() => {}}
        ahora={AHORA}
      />,
    );
    expect(screen.getByText("Ya hice el traspaso")).toBeInTheDocument();

    const otraCausa = agrupar([
      makeFakeIntent({
        id: "v2",
        idempotencyKey: "k2",
        httpStatus: 422,
        errorCode: "cliente_nombre_required",
      }),
    ])[0];
    rerender(
      <IntentoCard
        intento={otraCausa}
        seleccionado={false}
        onSeleccionar={() => {}}
        onAccion={() => {}}
        ahora={AHORA}
      />,
    );
    expect(screen.getByText("Reenviar")).toBeInTheDocument();
  });

  it("un pago dice 'Ver el pago', una venta 'Ver la venta'", () => {
    const pago = agrupar([
      makeFakeIntent({ id: "p1", idempotencyKey: "p", path: "/v2/cobranza/pagos" }),
    ])[0];
    render(
      <IntentoCard
        intento={pago}
        seleccionado={false}
        onSeleccionar={() => {}}
        onAccion={() => {}}
        ahora={AHORA}
      />,
    );
    expect(screen.getByText("Ver el pago")).toBeInTheDocument();
  });

  it("el clic en la tarjeta selecciona; el clic en un botón NO", () => {
    const onSeleccionar = vi.fn();
    const onAccion = vi.fn();
    const intento = unaVenta();
    render(
      <IntentoCard
        intento={intento}
        seleccionado={false}
        onSeleccionar={onSeleccionar}
        onAccion={onAccion}
        ahora={AHORA}
      />,
    );

    fireEvent.click(screen.getByTestId("intento-card-v1"));
    expect(onSeleccionar).toHaveBeenCalledWith(intento);

    onSeleccionar.mockClear();
    fireEvent.click(screen.getByTestId("intento-ignorar-v1"));
    expect(onAccion).toHaveBeenCalledWith("ignorar", intento);
    expect(onSeleccionar).not.toHaveBeenCalled();
  });

  it("se puede seleccionar con el teclado y el foco se ve", () => {
    const onSeleccionar = vi.fn();
    const intento = unaVenta();
    render(
      <IntentoCard
        intento={intento}
        seleccionado={false}
        onSeleccionar={onSeleccionar}
        onAccion={() => {}}
        ahora={AHORA}
      />,
    );

    const card = screen.getByTestId("intento-card-v1");
    expect(card).toHaveAttribute("tabIndex", "0");
    expect(card.className).toContain("focus-visible:outline");

    fireEvent.keyDown(card, { key: "Enter" });
    expect(onSeleccionar).toHaveBeenCalledWith(intento);
  });

  it("sin nombre capturado lo dice, no inventa uno", () => {
    const sinNombre = agrupar([
      makeFakeIntent({ id: "x", idempotencyKey: "x", body: null }),
    ])[0];
    render(
      <IntentoCard
        intento={sinNombre}
        seleccionado={false}
        onSeleccionar={() => {}}
        onAccion={() => {}}
        ahora={AHORA}
      />,
    );
    expect(screen.getByText("Sin nombre capturado")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
