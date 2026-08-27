import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EditarVentaHero } from "./EditarVentaHero";
import type { VentaV2 } from "@/services/api/ventaV2Types";

// El título del modal es un SEGUNDO editor del mismo campo que la pestaña
// Cliente. Si se queda abierto cuando la venta tiene un cliente de Microsip
// ligado, basta con renombrar desde aquí para desincronizar el nombre del
// cliente_id — que es el defecto que aplicó tres ventas al cliente
// equivocado. Estas pruebas existen para que esa puerta no se reabra.

const venta = {
  id: "11111111-1111-1111-1111-111111111111",
  fecha_venta: "2026-08-19T12:00:00Z",
  tipo_venta: "CREDITO",
  microsip_folio: null,
} as unknown as VentaV2;

function renderHero(nombreBloqueado: boolean, onNombreChange = vi.fn()) {
  render(
    <EditarVentaHero
      venta={venta}
      nombre="MARIA YOLANDA CORTES"
      onNombreChange={onNombreChange}
      nombreBloqueado={nombreBloqueado}
      totalAnualCalculado={4200}
      activeProductsCount={1}
      activeImagesCount={2}
    />
  );
  return onNombreChange;
}

describe("EditarVentaHero — edición del nombre en el título", () => {
  it("sin cliente ligado, al hacer clic en el título aparece el campo editable", async () => {
    renderHero(false);

    await userEvent.click(screen.getByRole("button", { name: "MARIA YOLANDA CORTES" }));

    expect(screen.getByDisplayValue("MARIA YOLANDA CORTES")).toBeInTheDocument();
  });

  it("con cliente ligado el título NO abre el campo editable", async () => {
    renderHero(true);

    const titulo = screen.getByRole("button", { name: "MARIA YOLANDA CORTES" });
    await userEvent.click(titulo);

    expect(screen.queryByDisplayValue("MARIA YOLANDA CORTES")).not.toBeInTheDocument();
    expect(titulo).toBeDisabled();
  });

  it("con cliente ligado el título nunca reporta un nombre nuevo", async () => {
    const onNombreChange = renderHero(true);

    await userEvent.click(screen.getByRole("button", { name: "MARIA YOLANDA CORTES" }));

    expect(onNombreChange).not.toHaveBeenCalled();
  });

  it("con cliente ligado el título explica dónde se edita", () => {
    renderHero(true);

    expect(screen.getByRole("button", { name: "MARIA YOLANDA CORTES" })).toHaveAttribute(
      "title",
      "Se edita en Microsip"
    );
  });
});
