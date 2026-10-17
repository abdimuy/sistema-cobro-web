import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { EjeJornada } from "../EjeJornada";
import { makeJornada } from "../../../application/__tests__/fakeDesempenoPort";

function montar(over: Parameters<typeof makeJornada>[0] = {}) {
  render(<EjeJornada jornada={makeJornada(over)} onAbrirActividad={() => {}} />);
  return screen.getByRole("region", { name: "Línea del día" });
}

const resumen = {
  ...makeJornada().resumen,
  minutosActivos: 346,
  pausas: { n: 2, minutos: 70, enCurso: false },
  clientes: 38,
  pagos: { n: 41, importe: "8200.00" },
  visitas: 13,
  condonaciones: { n: 0, importe: "0.00" },
};

describe("EjeJornada — opción A: totales en el encabezado (E-INF-018)", () => {
  it("encabezado con horario, activas, pausas, clientes y cobrado; importe por carril", () => {
    const tarjeta = montar({ horario: { desdeHora: "08:00", hastaHora: "18:00" }, resumen });
    expect(
      within(tarjeta).getByText("08:00–18:00 · 5 h 46 activas · 1 h 10 en 2 pausas · 38 clientes"),
    ).toBeInTheDocument();
    expect(within(tarjeta).getByText("cobrado")).toBeInTheDocument();
    // el importe grande del encabezado
    expect(within(tarjeta).getAllByText("$8,200")).toHaveLength(2); // encabezado + carril de pagos
    const carril = (t: string) => tarjeta.querySelector(`[data-carril="${t}"]`) as HTMLElement;
    expect(carril("pago")).toHaveTextContent("Pagos 41");
    expect(carril("pago")).toHaveTextContent("$8,200");
    expect(carril("condonacion")).toHaveTextContent("Condonaciones 0");
    expect(carril("condonacion")).toHaveTextContent("$0");
    expect(carril("visita")).toHaveTextContent("Visitas 13");
    expect(carril("visita")).not.toHaveTextContent("$");
  });

  it("sin horario configurado el rango es de la primera a la última actividad", () => {
    const tarjeta = montar({ horario: null });
    // 14:20Z = 08:20 y 16:40Z = 10:40 en la oficina
    expect(within(tarjeta).getByText(/^08:20–10:40 · /)).toBeInTheDocument();
  });

  it("las etiquetas de hora salen del eje del servidor", () => {
    const tarjeta = montar({ eje: { desdeHora: 5, hastaHora: 22 } });
    const horas = Array.from(within(tarjeta).getByTestId("eje-horas").children).map((e) => e.textContent);
    expect(horas[0]).toBe("5");
    expect(horas[horas.length - 1]).toBe("22");
    expect(horas).toHaveLength(18);
  });

  it("un punto de las 05:40 queda dentro del eje 5–22, no pegado al borde", () => {
    // 11:40Z = 05:40 en la oficina
    render(
      <EjeJornada
        jornada={makeJornada({
          eje: { desdeHora: 5, hastaHora: 22 },
          actividades: [makeJornada().actividades[0]].map((a) => ({ ...a, hora: "2026-10-14T11:40:00Z" })),
        })}
        onAbrirActividad={() => {}}
      />,
    );
    const left = parseFloat(screen.getByTestId("eje-punto").style.left);
    expect(left).toBeGreaterThan(0);
    expect(left).toBeCloseTo((40 / (17 * 60)) * 100, 3);
  });
});
