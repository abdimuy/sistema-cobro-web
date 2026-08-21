import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { IntentosTranquilos } from "./IntentosTranquilos";
import { agrupar } from "../domain/entities";
import { makeFakeIntent } from "../application/__tests__/fakeRepoPort";

const AHORA = new Date("2026-08-19T19:34:00.000Z");

const TRANQUILOS = agrupar([
  makeFakeIntent({
    id: "a",
    idempotencyKey: "venta-a",
    path: "/v2/ventas",
    httpStatus: 503,
    errorCode: null,
    receivedAt: new Date("2026-08-13T10:00:00.000Z"),
    body: {
      cliente: { nombre: "Martha Villa Luciano" },
      tipo_venta: "CREDITO",
      montos: { corto_plazo: "10600.00" },
    },
  }),
  makeFakeIntent({
    id: "b",
    idempotencyKey: "pago-b",
    path: "/v2/cobranza/pagos",
    httpStatus: 408,
    errorCode: null,
    receivedAt: new Date("2026-08-19T09:00:00.000Z"),
    body: null,
  }),
]);

describe("IntentosTranquilos", () => {
  it("una fila por trabajo, con quién, módulo, qué pasó, monto e intentos", () => {
    render(<IntentosTranquilos intentos={TRANQUILOS} onSeleccionar={() => {}} ahora={AHORA} />);

    expect(screen.getByTestId("intento-tranquilo-a")).toBeInTheDocument();
    expect(screen.getByTestId("intento-tranquilo-b")).toBeInTheDocument();
    expect(screen.getByText("Martha Villa Luciano")).toBeInTheDocument();
    expect(screen.getByText("El servidor no respondió")).toBeInTheDocument();
    expect(screen.getByText("La subida se cortó")).toBeInTheDocument();
    expect(screen.getByText(/10,600\.00/)).toBeInTheDocument();
  });

  it("ventas y pagos conviven en la misma tabla", () => {
    render(<IntentosTranquilos intentos={TRANQUILOS} onSeleccionar={() => {}} ahora={AHORA} />);
    expect(screen.getByText("Venta")).toBeInTheDocument();
    expect(screen.getByText("Pago")).toBeInTheDocument();
  });

  it("no lleva acento ni botones: nada aquí pide nada", () => {
    // El acento ladrillo está reservado a la zona de arriba. Si aparece aquí
    // en reposo, deja de significar "hace falta una persona" y la pantalla
    // vuelve a ser una lista plana.
    //
    // El anillo de foco es la excepción y no cuenta: sólo existe mientras el
    // teclado está en la fila, y es la misma señal de accesibilidad de toda
    // la app.
    const { container } = render(
      <IntentosTranquilos intentos={TRANQUILOS} onSeleccionar={() => {}} ahora={AHORA} />,
    );
    expect(container.querySelectorAll("button")).toHaveLength(0);

    const enReposo = container.innerHTML.replace(/focus-visible:[^\s"]+/g, "");
    expect(enReposo).not.toContain("A33A2A");
    expect(enReposo).not.toContain("E38B76");
  });

  it("la fila abre el detalle con clic y con teclado, y el foco se ve", () => {
    const onSeleccionar = vi.fn();
    render(
      <IntentosTranquilos intentos={TRANQUILOS} onSeleccionar={onSeleccionar} ahora={AHORA} />,
    );

    const fila = screen.getByTestId("intento-tranquilo-a");
    expect(fila).toHaveAttribute("tabIndex", "0");
    expect(fila.className).toContain("focus-visible:outline");

    fireEvent.click(fila);
    expect(onSeleccionar).toHaveBeenCalledWith(TRANQUILOS[0]);

    fireEvent.keyDown(fila, { key: "Enter" });
    expect(onSeleccionar).toHaveBeenCalledTimes(2);
  });

  it("sin filas lo dice en una frase, no con una tabla vacía", () => {
    render(<IntentosTranquilos intentos={[]} onSeleccionar={() => {}} ahora={AHORA} />);
    expect(screen.getByTestId("tranquilos-vacio")).toHaveTextContent(
      "Nada reintentándose ahora mismo",
    );
    expect(screen.queryByTestId("intentos-tranquilos")).toBeNull();
  });
});
