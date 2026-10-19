import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavegadorDia } from "../NavegadorDia";
import { sumarDias } from "../../lib/format";

const HOY = "2026-10-14";
// Semana vencida: el servidor manda los últimos 14 días (E-INF-018).
const CATORCE = Array.from({ length: 14 }, (_, i) => sumarDias(HOY, i - 13));
const INICIO_VIEJO = sumarDias(HOY, -338);

function montar(over: Partial<Parameters<typeof NavegadorDia>[0]> = {}) {
  const onCambiar = vi.fn();
  render(
    <NavegadorDia
      dia={HOY}
      hoy={HOY}
      inicioSemanaDia={INICIO_VIEJO}
      diasNavegables={CATORCE}
      onCambiar={onCambiar}
      {...over}
    />,
  );
  return { onCambiar };
}

describe("NavegadorDia (días navegables del servidor, E-INF-018)", () => {
  it("con semana vencida hay 14 chips de día más 'inicio', no 339", () => {
    montar();
    const chips = screen.getAllByRole("button", { pressed: false }).concat(
      screen.getAllByRole("button", { pressed: true }),
    );
    // 14 días + inicio; las dos flechas no tienen aria-pressed.
    expect(chips.filter((b) => b.hasAttribute("aria-pressed"))).toHaveLength(15);
    expect(screen.getByRole("button", { name: "Inicio de semana" })).toBeInTheDocument();
  });

  it("'inicio' lleva al inicio de semana", async () => {
    const { onCambiar } = montar();
    await userEvent.click(screen.getByRole("button", { name: "Inicio de semana" }));
    expect(onCambiar).toHaveBeenCalledWith(INICIO_VIEJO);
  });

  it("sin inicio de semana o con el inicio ya en la lista no hay chip 'inicio'", () => {
    montar({ inicioSemanaDia: null });
    expect(screen.queryByRole("button", { name: "Inicio de semana" })).not.toBeInTheDocument();
  });

  // Decisión del dueño (2026-10-19): con la semana vencida el servidor manda
  // dias_navegables: [] y la ficha no lleva botones de día, tampoco "inicio".
  it("sin días navegables (semana vencida) no hay ningún chip de día ni 'inicio'", () => {
    montar({ diasNavegables: [] });
    expect(screen.queryByRole("button", { name: "Inicio de semana" })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"))).toHaveLength(0);
    // Tampoco flechas: no hay navegación por días (decisión del coordinador).
    expect(screen.queryByRole("button", { name: "Día anterior" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Día siguiente" })).not.toBeInTheDocument();
  });

  it("control positivo: con días navegables sí hay flechas", () => {
    montar();
    expect(screen.getByRole("button", { name: "Día anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Día siguiente" })).toBeInTheDocument();
  });

  it("semana no vencida: los chips son los días que manda el servidor, sin 'inicio' repetido", () => {
    const semana = ["2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", HOY];
    montar({ inicioSemanaDia: "2026-10-09", diasNavegables: semana });
    expect(screen.queryByRole("button", { name: "Inicio de semana" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"))).toHaveLength(6);
  });
});
