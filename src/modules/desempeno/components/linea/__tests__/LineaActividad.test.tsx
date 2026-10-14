import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LineaActividad } from "../LineaActividad";
import { makeLinea, makePausa } from "../../../application/__tests__/fakeDesempenoPort";

const base = {
  linea: makeLinea(),
  pausaMin: 45,
  horario: null,
  ahora: null,
};

function punto(id: string): HTMLElement {
  return screen.getAllByTestId("punto").find((p) => p.getAttribute("data-id") === id)!;
}

describe("LineaActividad — Puntos", () => {
  it("un punto por actividad y la pausa sombreada", () => {
    render(<LineaActividad {...base} vista="puntos" />);
    expect(screen.getAllByTestId("punto")).toHaveLength(5);
    expect(screen.getAllByTestId("pausa")).toHaveLength(1);
    expect(screen.queryByTestId("tramo")).not.toBeInTheDocument();
  });

  it("el punto se ubica en la hora de la oficina (08:20 → 10.26 % del eje 7–20 h)", () => {
    render(<LineaActividad {...base} vista="puntos" />);
    expect(parseFloat(punto("pago:15082369").style.left)).toBeCloseTo(10.256, 2);
  });

  it("los elementos de la línea no son enfocables (spec §10: solo ratón)", () => {
    render(<LineaActividad {...base} vista="puntos" />);
    expect(punto("pago:15082369")).not.toHaveAttribute("tabindex");
    expect(screen.getByTestId("pausa")).not.toHaveAttribute("tabindex");
  });

  it("popover del punto de pago: cliente, monto y fotos del API (contrato v2)", async () => {
    const user = userEvent.setup();
    render(<LineaActividad {...base} vista="puntos" />);
    await user.hover(punto("pago:15082369"));
    expect(await screen.findByText("Pago · 08:20")).toBeInTheDocument();
    expect(screen.getByText("JUANA ANDRADE LECHUGA")).toBeInTheDocument();
    expect(screen.getByText("$150.00")).toBeInTheDocument();
    expect(screen.getByText("Fotos")).toBeInTheDocument();
  });

  it("popover del punto de visita: el resultado literal, sin monto", async () => {
    const user = userEvent.setup();
    render(<LineaActividad {...base} vista="puntos" />);
    await user.hover(punto("visita:412cc2fc-7d0e-4b8a-9c1f-5e6a7b8c9d0e"));
    expect(await screen.findByText("Visita · 08:45")).toBeInTheDocument();
    expect(screen.getByText("MARÍA ELENA CUAUTLE TLAPA")).toBeInTheDocument();
    expect(screen.getByText("No se encontraba")).toBeInTheDocument();
    expect(screen.queryByText("Monto")).not.toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("LineaActividad — Bloques", () => {
  it("tramos del API y su popover sin cifras inventadas", async () => {
    const user = userEvent.setup();
    render(<LineaActividad {...base} vista="bloques" />);
    const tramos = screen.getAllByTestId("tramo");
    expect(tramos).toHaveLength(2);

    await user.hover(tramos[0]);

    expect(await screen.findByText("08:20–09:10")).toBeInTheDocument();
    expect(screen.getByText("2 · $300")).toBeInTheDocument();
    expect(screen.getByText("Clientes atendidos")).toBeInTheDocument();
  });

  it("popover de la pausa: duración, horas y qué hubo antes y después", async () => {
    const user = userEvent.setup();
    render(<LineaActividad {...base} vista="bloques" />);
    await user.hover(screen.getByTestId("pausa"));
    expect(await screen.findByText("Pausa · 1 h 12 min")).toBeInTheDocument();
    expect(screen.getByText("09:10–10:22")).toBeInTheDocument();
    expect(screen.getByText("09:10 · pago")).toBeInTheDocument();
    expect(screen.getByText("10:22 · pago")).toBeInTheDocument();
    expect(screen.getByText("Hueco de 45 min o más sin movimientos.")).toBeInTheDocument();
  });

  it("pausa en curso dice 'ahora' y 'sigue sin actividad'", async () => {
    const user = userEvent.setup();
    const linea = makeLinea({
      pausas: [makePausa({ hasta: "2026-10-14T22:40:00Z", minutos: 378, siguienteId: null, enCurso: true })],
    });
    render(<LineaActividad {...base} linea={linea} vista="bloques" />);
    await user.hover(screen.getByTestId("pausa"));
    expect(await screen.findByText("09:10–ahora")).toBeInTheDocument();
    expect(screen.getByText("sigue sin actividad")).toBeInTheDocument();
  });
});

describe("LineaActividad — Por hora y Bloques + hora", () => {
  it("13 barras (7..19) y popover de una hora con su importe del API", async () => {
    const user = userEvent.setup();
    render(<LineaActividad {...base} vista="por_hora" />);
    const barras = screen.getAllByTestId("barra-hora");
    expect(barras).toHaveLength(13);

    await user.hover(barras[3]); // 10:00

    expect(await screen.findByText("10:00–11:00")).toBeInTheDocument();
    expect(screen.getByText("1 · $150")).toBeInTheDocument();
  });

  it("una hora vacía lo dice", async () => {
    const user = userEvent.setup();
    render(<LineaActividad {...base} vista="por_hora" />);
    await user.hover(screen.getAllByTestId("barra-hora")[0]); // 07:00
    expect(await screen.findByText("07:00–08:00")).toBeInTheDocument();
    expect(screen.getByText("Sin movimientos en esta hora.")).toBeInTheDocument();
  });

  it("Bloques + hora pinta tramos, barras y la tira de pausas", () => {
    render(<LineaActividad {...base} vista="bloques_hora" />);
    expect(screen.getAllByTestId("tramo")).toHaveLength(2);
    expect(screen.getAllByTestId("barra-hora")).toHaveLength(13);
    expect(screen.getAllByTestId("pausa")).toHaveLength(1);
  });
});

describe("LineaActividad — bordes", () => {
  it("sin línea no pinta actividad pero sí la marca de ahora si la hay", () => {
    render(<LineaActividad {...base} linea={null} vista="bloques" ahora="2026-10-14T22:40:00Z" />);
    expect(screen.queryByTestId("tramo")).not.toBeInTheDocument();
    expect(screen.getByTestId("marca-ahora")).toBeInTheDocument();
  });

  it("la marca de ahora solo aparece si se pasa `ahora` (días pasados no)", () => {
    render(<LineaActividad {...base} vista="bloques" />);
    expect(screen.queryByTestId("marca-ahora")).not.toBeInTheDocument();
  });

  it("con horario, sombrea antes y después", () => {
    render(<LineaActividad {...base} vista="bloques" horario={{ desde: "08:00", hasta: "18:00" }} />);
    expect(screen.getAllByTestId("fuera-horario")).toHaveLength(2);
  });

  it("describir permite al llamador nombrar mejor lo de antes y después (jornada)", async () => {
    const user = userEvent.setup();
    render(
      <LineaActividad
        {...base}
        vista="bloques"
        describir={(id) => (id === "pago:15082370" ? "09:10 · pago · PEDRO TEHUITZIL ZEPEDA" : null)}
      />,
    );
    await user.hover(screen.getByTestId("pausa"));
    expect(await screen.findByText("09:10 · pago · PEDRO TEHUITZIL ZEPEDA")).toBeInTheDocument();
  });
});
