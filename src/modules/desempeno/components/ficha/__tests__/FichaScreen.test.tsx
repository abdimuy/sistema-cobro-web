import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FichaScreen } from "../FichaScreen";
import type { PestanaFicha } from "../pestanas";
import { esPestana } from "../pestanas";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import {
  makeUsuarioSinConfigurar,
  makeUsuarioTablero,
} from "../../../application/__tests__/fakeDesempenoPort";
import type { UsuarioTablero } from "../../../domain/entities";

function montar(pestana: PestanaFicha = "jornada", usuario: UsuarioTablero = makeUsuarioTablero()) {
  const props = {
    onCambiarPestana: vi.fn(),
    onCambiarDia: vi.fn(),
    onVolver: vi.fn(),
    onAbrirActividad: vi.fn(),
    onAbrirCuenta: vi.fn(),
  };
  renderConDesempeno(
    <FichaScreen
      usuario={usuario}
      periodo="hoy"
      generadoAt="2026-10-14T22:40:00Z"
      opcionesRegistro={[{ valor: "uid-juan", etiqueta: "Juan Carlos Méndez" }]}
      pestana={pestana}
      dia="2026-10-14"
      hoy="2026-10-14"
      {...props}
    />,
  );
  return props;
}

describe("FichaScreen", () => {
  beforeEach(() => localStorage.clear());

  it("encabezado con zona, inicio de semana, estado y cifras del usuario (sin totales del equipo)", () => {
    montar();
    expect(screen.getByRole("heading", { name: "Juan Carlos Méndez" })).toBeInTheDocument();
    expect(screen.getByText("RUTA 21")).toBeInTheDocument();
    expect(screen.getByText("Semana desde vie 9 oct, 07:46 · hace 5 d")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Cobrado hoy")).toBeInTheDocument();
    expect(screen.getByText("$8,600")).toBeInTheDocument();
    expect(screen.getByText("46 de 232")).toBeInTheDocument();
    expect(screen.getByText("65.9%")).toBeInTheDocument();
    expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
  });

  it("lo que falta por cobrar es el cobro.falta del API, y la hora de los datos es generado_at", () => {
    montar();
    expect(screen.getByText("por cobrar $4,450")).toBeInTheDocument();
    expect(screen.getByText("Datos de las 16:40")).toBeInTheDocument();
  });

  it("usuario sin configurar: dice qué falta y no se rompe", () => {
    montar("cuentas", makeUsuarioSinConfigurar());
    expect(screen.getByRole("heading", { name: "Norma Velázquez Rojas" })).toBeInTheDocument();
    expect(screen.getByText("Sin configurar · falta la zona")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("inicio de semana en el futuro (contrato v2.1): lo dice en el encabezado", () => {
    montar("cuentas", makeUsuarioSinConfigurar({ motivoNoConfigurado: "inicio_semana_futuro" }));
    expect(screen.getByText("Sin configurar · el inicio de semana aún no llega")).toBeInTheDocument();
  });

  it("pestañas: marca la actual y avisa al cambiar", async () => {
    const user = userEvent.setup();
    const props = montar("jornada");
    expect(screen.getByRole("tab", { name: "Jornada" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Cuentas de la semana/ })).toHaveTextContent("232");
    await user.click(screen.getByRole("tab", { name: /Actividad de la zona/ }));
    expect(props.onCambiarPestana).toHaveBeenCalledWith("actividad");
  });

  it("muestra el contenido de la pestaña pedida", async () => {
    montar("cuentas");
    expect(await screen.findByRole("button", { name: /Sin nada/ })).toBeInTheDocument();
  });

  it("Equipo regresa al tablero", async () => {
    const user = userEvent.setup();
    const props = montar();
    await user.click(screen.getByRole("button", { name: /Equipo/ }));
    expect(props.onVolver).toHaveBeenCalled();
  });

  it("esPestana reconoce solo las tres pestañas", () => {
    expect(esPestana("cuentas")).toBe(true);
    expect(esPestana("excel")).toBe(false);
    expect(esPestana(null)).toBe(false);
  });

  it("cifras incoherentes a propósito: se pinta lo que manda el API, sin recalcular", () => {
    montar(
      "jornada",
      makeUsuarioTablero({
        cobertura: { conAlgo: 186, total: 232 },
        coberturaPorSegmento: { sinVisitar: 46, volver: 20, despues: 3, pagados: 140, sinNada: 50 },
        cobro: { cobrado: "8600.00", esperado: "13050.00", falta: "4000.00", pct: "61.00" },
      }),
    );
    expect(screen.getByText("50 de 232")).toBeInTheDocument();
    expect(screen.getByText("por cobrar $4,000")).toBeInTheDocument();
    expect(screen.getByText("61.0%")).toBeInTheDocument();
  });

  it("el día de inicio de semana es el de la oficina (03:00Z del sábado = viernes en CDMX)", () => {
    montar("jornada", makeUsuarioTablero({ inicioSemana: "2026-10-10T03:00:00Z" }));
    expect(screen.getByText("Semana desde vie 9 oct, 21:00 · hace 5 d")).toBeInTheDocument();
  });

  it("usuario sin configurar: enlace a Usuarios en el encabezado", () => {
    montar("cuentas", makeUsuarioSinConfigurar());
    const enlaces = screen.getAllByRole("link", { name: "Configurar en Usuarios" });
    expect(enlaces[0]).toHaveAttribute("href", "/settings");
  });

  it("pestañas enlazadas con su panel (aria-controls / aria-labelledby)", () => {
    montar("actividad");
    const tab = screen.getByRole("tab", { name: /Actividad de la zona/ });
    const panel = screen.getByRole("tabpanel");
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});
