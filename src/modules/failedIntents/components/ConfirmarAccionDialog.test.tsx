import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ConfirmarAccionDialog } from "./ConfirmarAccionDialog";
import { avisoDe, type AccionMutante } from "./accionesCopy";
import { agrupar } from "../domain/entities";
import { makeFakeIntent } from "../application/__tests__/fakeRepoPort";

const VENTA = agrupar([
  makeFakeIntent({
    id: "v1",
    idempotencyKey: "venta-77",
    path: "/v2/ventas",
    body: {
      cliente: { nombre: "Carmen López Zavaleta" },
      tipo_venta: "CREDITO",
      montos: { corto_plazo: "10300.00" },
    },
  }),
])[0];

function montar(accion: AccionMutante | null, onConfirm = vi.fn(), onCancel = vi.fn()) {
  render(
    <ConfirmarAccionDialog
      accion={accion}
      intento={VENTA}
      pending={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { onConfirm, onCancel };
}

describe("ConfirmarAccionDialog", () => {
  it("cerrado mientras no haya acción: nada se ejecuta al primer clic de la tarjeta", () => {
    montar(null);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("nombra al cliente y el monto correctos, no 'este intento'", () => {
    montar("reenviar");
    const cuerpo = screen.getByTestId("confirmar-cuerpo");
    expect(cuerpo).toHaveTextContent("Carmen López Zavaleta");
    expect(cuerpo).toHaveTextContent("$10,300.00");
  });

  it("el botón repite el verbo del que lo abrió", () => {
    const casos: Array<[AccionMutante, string]> = [
      ["reenviar", "Reenviar"],
      ["atender", "Marcar atendida"],
      ["ignorar", "Ignorar"],
      ["reenviar_editado", "Reenviar"],
    ];
    for (const [accion, verbo] of casos) {
      const { unmount } = render(
        <ConfirmarAccionDialog
          accion={accion}
          intento={VENTA}
          pending={false}
          onConfirm={() => {}}
          onCancel={() => {}}
        />,
      );
      expect(screen.getByTestId("confirmar-boton")).toHaveTextContent(verbo);
      unmount();
    }
  });

  it("cancelar NO llama al puerto", () => {
    const { onConfirm, onCancel } = montar("ignorar");
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("confirmar llama UNA sola vez con su acción", () => {
    const { onConfirm } = montar("reenviar");
    fireEvent.click(screen.getByTestId("confirmar-boton"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("reenviar");
  });

  it("reenviar con cuerpo editado pide DOS confirmaciones", () => {
    // Manda datos distintos a los que capturó el vendedor: un clic no basta.
    const { onConfirm } = montar("reenviar_editado");

    fireEvent.click(screen.getByTestId("confirmar-boton"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByTestId("confirmar-cuerpo")).toHaveTextContent("Confirma otra vez");

    fireEvent.click(screen.getByTestId("confirmar-boton"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("reenviar_editado");
  });

  it("reabrir la doble confirmación vuelve al primer paso", () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ConfirmarAccionDialog
        accion="reenviar_editado"
        intento={VENTA}
        pending={false}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId("confirmar-boton"));

    // Se cierra a medias…
    rerender(
      <ConfirmarAccionDialog
        accion={null}
        intento={VENTA}
        pending={false}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    // …y se vuelve a abrir: el segundo clic no debe quedar a un clic.
    rerender(
      <ConfirmarAccionDialog
        accion="reenviar_editado"
        intento={VENTA}
        pending={false}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );

    fireEvent.click(screen.getByTestId("confirmar-boton"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("mientras está en vuelo el botón no dispara de nuevo", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmarAccionDialog
        accion="reenviar"
        intento={VENTA}
        pending
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    const boton = screen.getByTestId("confirmar-boton");
    expect(boton).toBeDisabled();
    expect(boton).toHaveTextContent("Reenviando…");
    fireEvent.click(boton);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("sin nombre capturado, el diálogo lo dice en vez de inventarlo", () => {
    const sinNombre = agrupar([makeFakeIntent({ id: "x", idempotencyKey: "x", body: null })])[0];
    render(
      <ConfirmarAccionDialog
        accion="reenviar"
        intento={sinNombre}
        pending={false}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByTestId("confirmar-cuerpo")).toHaveTextContent("sin nombre capturado");
  });
});

describe("avisoDe", () => {
  it("el aviso es el verbo en pasado, no 'operación completada'", () => {
    expect(avisoDe("reenviar")).toBe("Reenviado");
    expect(avisoDe("reenviar_editado")).toBe("Reenviado");
    expect(avisoDe("atender")).toBe("Marcada como atendida");
    expect(avisoDe("ignorar")).toBe("Ignorada");
  });
});
