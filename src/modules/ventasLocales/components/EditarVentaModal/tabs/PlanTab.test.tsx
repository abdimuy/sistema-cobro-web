import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { PlanTab } from "./PlanTab";
import type { FinancieroFormData } from "../../../presentation/hooks/useVentaEditState";

// El campo FECHA DE VENTA es un `datetime-local`: un reloj de pared SIN zona.
// El valor que guarda la venta es un instante UTC. Traducir entre los dos con
// `String.slice` mete el reloj UTC en un control local, y el usuario ve una
// fecha que no es la de la venta.
//
// Medido el 2026-09-01: una venta capturada a las 18:38 de México se guarda
// como 2026-09-02T00:38Z. El encabezado decía "01 SEP 2026" (bien) y este
// campo decía "09/02/2026, 12:38 AM" (mal). Quien "corregía" el campo a
// 09/01 escribía el 31 de agosto y retrocedía la venta un día completo.
//
// Estas pruebas fijan las dos direcciones de la conversión. Fallan si alguien
// vuelve a poner un `slice`.

const INSTANTE_UTC = "2026-09-02T00:38:00Z";
const RELOJ_DE_NEGOCIO = "2026-09-01T18:38";

const financiero = (overrides: Partial<FinancieroFormData> = {}): FinancieroFormData => ({
  tipoVenta: "CONTADO",
  montoAnual: "0.00",
  montoCortoPlazo: "0.00",
  montoContado: "0.00",
  plazoMeses: 0,
  enganche: "0.00",
  parcialidad: "0.00",
  frecPago: "",
  diaCobranzaSemana: "",
  diaCobranzaMes: 0,
  nota: "",
  fechaVenta: INSTANTE_UTC,
  ...overrides,
});

function renderPlanTab(overrides: Partial<FinancieroFormData> = {}) {
  const onUpdate = vi.fn();
  render(
    <PlanTab
      data={financiero(overrides)}
      errors={[]}
      preciosCalculados={{ anual: 0, cortoPlazo: 0, contado: 0 }}
      onUpdate={onUpdate}
    />,
  );
  return { onUpdate, campo: screen.getByLabelText("Fecha de venta") };
}

describe("PlanTab — fecha de venta", () => {
  it("muestra el reloj del negocio, no el instante UTC crudo", () => {
    const { campo } = renderPlanTab();

    expect(campo).toHaveValue(RELOJ_DE_NEGOCIO);
  });

  it("al escribir un reloj del negocio reporta el instante UTC equivalente", () => {
    const { onUpdate, campo } = renderPlanTab();

    fireEvent.change(campo, { target: { value: "2026-09-01T09:15" } });

    expect(onUpdate).toHaveBeenLastCalledWith("fechaVenta", "2026-09-01T15:15:00Z");
  });

  // El daño concreto: alguien ve el día equivocado, lo "corrige" un día, y la
  // venta retrocede treinta horas porque la escritura reestampaba la Z.
  it("corregir el día que se ve mueve la venta EXACTAMENTE ese día", () => {
    const { onUpdate, campo } = renderPlanTab();

    fireEvent.change(campo, { target: { value: "2026-08-31T18:38" } });

    const ultimaLlamada = onUpdate.mock.calls[onUpdate.mock.calls.length - 1] as [
      string,
      string,
    ];
    const escrito = ultimaLlamada[1];
    expect(escrito).toBe("2026-09-01T00:38:00Z");
    expect(new Date(INSTANTE_UTC).getTime() - new Date(escrito).getTime()).toBe(
      24 * 60 * 60 * 1000,
    );
  });

  it("acepta un instante con milisegundos sin perder la hora", () => {
    const { campo } = renderPlanTab({ fechaVenta: "2026-09-02T00:38:12.482Z" });

    expect(campo).toHaveValue(RELOJ_DE_NEGOCIO);
  });

  // Con una fecha ilegible el campo tiene que salir VACÍO, no tumbar la
  // pantalla. No es hipotético: el formulario de replay de intentos fallidos
  // monta esta misma pestaña para editar cuerpos que el servidor rechazó, y
  // su guardia estructural sólo exige que `fecha_venta` sea un string.
  // Además no hay un solo ErrorBoundary en src/, así que un throw en render
  // desmonta la aplicación entera, no el modal.
  it.each([
    ["vacía", ""],
    ["basura", "ayer por la tarde"],
    ["fuera del calendario", "2026-13-45T99:99:99Z"],
    ["una fecha sin hora", "2026-09-01"],
  ])("con una fecha %s el campo sale vacío y la pantalla no se cae", (_caso, valor) => {
    expect(() => renderPlanTab({ fechaVenta: valor })).not.toThrow();

    const campo = screen.getByLabelText("Fecha de venta");
    expect(campo).toHaveValue("");
  });
});
