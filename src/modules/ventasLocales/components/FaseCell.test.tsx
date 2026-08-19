import { readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { VentaLocal } from "@/services/api/getVentasLocales";
import type { VentaEvento } from "../domain/entities/VentaEvento";

vi.mock("../presentation/hooks/useVentaEventos", () => ({
  useVentaEventos: vi.fn(),
}));

import { FaseCell } from "./FaseCell";
import {
  FASE_PALETA,
  TRAZO_FUERA_DEL_CARRIL,
  type FasePaletaKey,
} from "./fasePaleta";
import { useVentaEventos } from "../presentation/hooks/useVentaEventos";

const mockUseVentaEventos = vi.mocked(useVentaEventos);

const AHORA = new Date("2026-08-18T18:00:00Z");
const MS_POR_DIA = 86_400_000;

const VENTA: VentaLocal = {
  LOCAL_SALE_ID: "7c2f1e40-9a3b-4c1d-8e55-2b7d4f6a9c31",
  USER_EMAIL: "carmelo.luna@muebleriamsp.mx",
  ALMACEN_ID: 19,
  NOMBRE_CLIENTE: "Eleazar Alva Rojas",
  FECHA_VENTA: "2026-08-12T15:04:00Z",
  LATITUD: 18.36,
  LONGITUD: -97.4,
  DIRECCION: "Av. Independencia 214",
  PRECIO_TOTAL: 21450,
  TELEFONO: "2381234567",
  ESTADO: "active",
  SITUACION: "aprobada",
  SINCRONIZACION: "pendiente",
};

const evento = (eventType: string, iso: string): VentaEvento => ({
  id: `${eventType}-${iso}`,
  eventType,
  payload: {},
  occurredAt: new Date(iso),
  actorNombre: "Óscar Roque Castillo",
});

const sinEventos = { eventos: [] as VentaEvento[], isLoading: false, error: null };

/**
 * Los dos tokens de color que murieron con esta regla. Se arman por piezas a
 * propósito: si se escribieran completos, el barrido de `src/` de más abajo se
 * encontraría a sí mismo y nunca podría fallar.
 */
const TOKENS_MUERTOS = ["detenida", "aplicada"].map((acento) => `fase-${acento}`);

/** Las cuatro fases del carril y la entrada de la paleta que le toca a cada una. */
const DEL_CARRIL: Array<[Partial<VentaLocal>, FasePaletaKey]> = [
  [{ SITUACION: "borrador" }, "borrador"],
  [{ SITUACION: "revisada" }, "revisada"],
  [{ SITUACION: "aprobada" }, "aprobada"],
  [{ SINCRONIZACION: "aplicada" }, "aplicada"],
];

const celda = () => screen.getByRole("button", { name: /fase/i });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(AHORA);
  mockUseVentaEventos.mockReset();
  mockUseVentaEventos.mockReturnValue(sinEventos);
});

afterEach(() => {
  vi.useRealTimers();
});

/** El anillo: r = 11, un solo arco de avance desde las doce. */
const CIRCUNFERENCIA = 2 * Math.PI * 11;

/** Primer valor del `stroke-dasharray`: lo pintado del arco de avance. */
const largoDelArco = (circulo: Element) =>
  Number.parseFloat((circulo.getAttribute("stroke-dasharray") ?? "").split(/[\s,]+/)[0]);

describe("FaseCell — la celda", () => {
  it("muestra el nombre de la fase y el tiempo que lleva en ella", () => {
    render(
      <FaseCell
        venta={{ ...VENTA, FASE_DESDE: new Date(AHORA.getTime() - 3 * 3_600_000).toISOString() }}
      />
    );

    expect(screen.getByText("Aprobada")).toBeInTheDocument();
    expect(screen.getByText("hace 3 h")).toBeInTheDocument();
  });

  it("una venta detenida lo dice en el segundo renglón", () => {
    render(
      <FaseCell
        venta={{ ...VENTA, FASE_DESDE: new Date(AHORA.getTime() - 6 * MS_POR_DIA).toISOString() }}
      />
    );

    const meta = screen.getByText("detenida 6 d");
    expect(meta).toBeInTheDocument();
    // Ya no va en ámbar: ese es el color de la fase revisada. Peso y brillo.
    expect(meta.className).toContain("text-foreground");
    expect(meta.className).toContain("font-medium");
    for (const token of TOKENS_MUERTOS) expect(meta.className).not.toContain(token);
  });

  it("sin fase_desde no dibuja segundo renglón", () => {
    render(<FaseCell venta={VENTA} />);

    expect(screen.getByText("Aprobada")).toBeInTheDocument();
    expect(screen.queryByTestId("fase-meta")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fase-meta-compacta")).not.toBeInTheDocument();
  });

  it("en compacta se pliega: anillo de 18 px, sin segundo renglón", () => {
    render(
      <FaseCell
        compact
        venta={{ ...VENTA, FASE_DESDE: new Date(AHORA.getTime() - 3 * 3_600_000).toISOString() }}
      />
    );

    expect(screen.getByTestId("fase-anillo")).toHaveAttribute("width", "18");
    expect(screen.queryByTestId("fase-meta")).not.toBeInTheDocument();
    expect(screen.queryByText("hace 3 h")).not.toBeInTheDocument();
  });

  it("en compacta sobreviven los días de una venta detenida", () => {
    render(
      <FaseCell
        compact
        venta={{ ...VENTA, FASE_DESDE: new Date(AHORA.getTime() - 6 * MS_POR_DIA).toISOString() }}
      />
    );

    const compacta = screen.getByTestId("fase-meta-compacta");
    expect(compacta).toHaveTextContent("6 d");
    expect(screen.queryByText("detenida 6 d")).not.toBeInTheDocument();
    // Mismo trato que el 2º renglón en densidad normal: peso, no ámbar.
    expect(compacta.className).toContain("font-medium");
    expect(compacta.className).toContain("text-foreground");
    for (const token of TOKENS_MUERTOS) {
      expect(compacta.className).not.toContain(token);
    }
  });

  it("el anillo lleva los arcos alcanzados y el tono de la fase", () => {
    render(<FaseCell venta={{ ...VENTA, SINCRONIZACION: "aplicada" }} />);

    const anillo = screen.getByTestId("fase-anillo");
    expect(anillo).toHaveAttribute("data-arcos", "4");
    expect(anillo).toHaveAttribute("data-tono", "aplicada");
    expect(anillo).toHaveAttribute("width", "26");
  });

  it("el anillo no lleva cifra adentro: a 26 px era una mancha", () => {
    render(<FaseCell venta={VENTA} />);

    expect(screen.getByTestId("fase-anillo").querySelector("text")).toBeNull();
  });

  it("una fase en curso son dos círculos: la pista entera y el arco de avance", () => {
    render(<FaseCell venta={{ ...VENTA, SITUACION: "borrador" }} />);

    const circulos = Array.from(
      screen.getByTestId("fase-anillo").querySelectorAll("circle")
    );
    expect(circulos).toHaveLength(2);

    const [pista, avance] = circulos;
    // La pista es un círculo completo: sin dasharray no hay huecos.
    expect(pista.getAttribute("stroke-dasharray")).toBeNull();
    // Va en la pista, no en el borde invisible del tema oscuro.
    expect(pista.getAttribute("stroke")).toBe("hsl(var(--fase-pista))");
    expect(pista.getAttribute("stroke")).not.toContain("--border");

    // El trazo hereda el color del <svg>, que lleva la clase de la paleta.
    expect(avance.getAttribute("stroke")).toBe("currentColor");
    expect(avance.getAttribute("stroke-dasharray")).not.toBeNull();
  });

  it("el arco de avance mide los cuartos alcanzados", () => {
    const casos: Array<[Partial<VentaLocal>, number]> = [
      [{ SITUACION: "borrador" }, 1],
      [{ SITUACION: "revisada" }, 2],
      [{ SITUACION: "aprobada" }, 3],
    ];

    for (const [parche, cuartos] of casos) {
      const { unmount } = render(<FaseCell venta={{ ...VENTA, ...parche }} />);

      const anillo = screen.getByTestId("fase-anillo");
      expect(anillo).toHaveAttribute("data-arcos", String(cuartos));

      const avance = Array.from(anillo.querySelectorAll("circle"))[1];
      expect(largoDelArco(avance)).toBeCloseTo((CIRCUNFERENCIA * cuartos) / 4, 2);

      unmount();
    }
  });

  it("en aplicada el anillo se cierra: un círculo continuo, sin huecos", () => {
    render(<FaseCell venta={{ ...VENTA, SINCRONIZACION: "aplicada" }} />);

    const anillo = screen.getByTestId("fase-anillo");
    const circulos = Array.from(anillo.querySelectorAll("circle"));
    expect(circulos).toHaveLength(1);
    expect(circulos[0].getAttribute("stroke-dasharray")).toBeNull();
    expect(circulos[0].getAttribute("stroke")).toBe("currentColor");
    expect(anillo.getAttribute("class")).toContain(FASE_PALETA.aplicada.trazo);
    expect(anillo.querySelector("path")).not.toBeNull();
    // El círculo continuo no borra el avance que la celda reporta.
    expect(anillo).toHaveAttribute("data-arcos", "4");
  });
});

describe("FaseAnillo — la geometría segmentada no vuelve", () => {
  it("no queda rastro de los cuatro arcos ni de sus desplazamientos", () => {
    const fuente = readFileSync(
      resolve(process.cwd(), "src/modules/ventasLocales/components/FaseAnillo.tsx"),
      "utf8"
    );

    for (const rastro of ["12.85", "56.3", "16.25", "32.5", "52.85", "strokeDashoffset"]) {
      expect(fuente).not.toContain(rastro);
    }
  });
});

describe("FaseAnillo — el color sale de la paleta compartida", () => {
  it("cada fase lleva la clase de color que le toca en la paleta", () => {
    for (const [parche, clave] of DEL_CARRIL) {
      const { unmount } = render(<FaseCell venta={{ ...VENTA, ...parche }} />);

      expect(screen.getByTestId("fase-anillo").getAttribute("class")).toContain(
        FASE_PALETA[clave].trazo
      );

      unmount();
    }
  });

  it("las salidas del carril se quedan en el atenuado", () => {
    const casos: Array<Partial<VentaLocal>> = [
      { SITUACION: "cancelada" },
      { ESTADO: "deleted" },
    ];

    for (const parche of casos) {
      const { unmount } = render(<FaseCell venta={{ ...VENTA, ...parche }} />);

      expect(screen.getByTestId("fase-anillo").getAttribute("class")).toContain(
        TRAZO_FUERA_DEL_CARRIL
      );

      unmount();
    }
  });

  it("los trazos heredan ese color y no traen uno propio", () => {
    for (const [parche] of DEL_CARRIL) {
      const { unmount } = render(<FaseCell venta={{ ...VENTA, ...parche }} />);
      const anillo = screen.getByTestId("fase-anillo");

      // Todo lo que se pinta va en currentColor salvo la pista, que es el
      // fondo contra el que se lee el avance.
      for (const trazo of Array.from(anillo.querySelectorAll("circle, path"))) {
        const stroke = trazo.getAttribute("stroke");
        if (trazo.getAttribute("data-pista") !== null) {
          expect(stroke).toBe("hsl(var(--fase-pista))");
        } else {
          expect(stroke).toBe("currentColor");
        }
      }

      unmount();
    }
  });
});

describe("FaseAnillo — detenida se dice con forma, no con color", () => {
  const detenida = {
    ...VENTA,
    FASE_DESDE: new Date(AHORA.getTime() - 6 * MS_POR_DIA).toISOString(),
  };
  const alCorriente = {
    ...VENTA,
    FASE_DESDE: new Date(AHORA.getTime() - 3 * 3_600_000).toISOString(),
  };

  const pistaDe = () =>
    screen.getByTestId("fase-anillo").querySelector("circle") as SVGCircleElement;

  it("la pista va punteada cuando la venta está detenida", () => {
    render(<FaseCell venta={detenida} />);

    const pista = pistaDe();
    expect(pista).toHaveAttribute("data-pista", "punteada");
    expect(pista.getAttribute("stroke-dasharray")).not.toBeNull();
    // La pista no hereda el color: sigue siendo el fondo del avance.
    expect(pista.getAttribute("stroke")).toBe("hsl(var(--fase-pista))");
  });

  it("y continua en todas las demás", () => {
    const casos: Array<Partial<VentaLocal>> = [
      { SITUACION: "borrador" },
      { SITUACION: "revisada" },
      { SITUACION: "aprobada" },
      { SITUACION: "cancelada" },
      { ESTADO: "deleted" },
    ];

    for (const parche of casos) {
      const { unmount } = render(
        <FaseCell venta={{ ...alCorriente, ...parche }} />
      );

      const pista = pistaDe();
      expect(pista).toHaveAttribute("data-pista", "continua");
      expect(pista.getAttribute("stroke-dasharray")).toBeNull();

      unmount();
    }
  });

  it("el arco de una detenida conserva el color de su fase", () => {
    render(<FaseCell venta={detenida} />);

    const anillo = screen.getByTestId("fase-anillo");
    const clases = anillo.getAttribute("class") ?? "";

    expect(anillo).toHaveAttribute("data-tono", "detenida");
    // VENTA está aprobada: el anillo va en cielo, no en un color de alerta.
    expect(clases).toContain(FASE_PALETA.aprobada.trazo);
    expect(clases).not.toContain("amber");
    expect(clases).not.toContain("destructive");
    for (const token of TOKENS_MUERTOS) expect(clases).not.toContain(token);
  });

  it("una revisada detenida y una al corriente comparten color en aro y cifra: sólo cambia la pista", () => {
    const { unmount } = render(
      <FaseCell venta={{ ...detenida, SITUACION: "revisada" }} />
    );
    const clasesDetenida = screen.getByTestId("fase-anillo").getAttribute("class");
    const cifraDetenida = screen.getByTestId("fase-cifra").className;
    const pistaDetenida = pistaDe().getAttribute("data-pista");
    unmount();

    render(<FaseCell venta={{ ...alCorriente, SITUACION: "revisada" }} />);
    const clasesNormal = screen.getByTestId("fase-anillo").getAttribute("class");
    const cifraNormal = screen.getByTestId("fase-cifra").className;
    const pistaNormal = pistaDe().getAttribute("data-pista");

    // Mismo hue en los dos dibujos, en las dos ventas.
    expect(clasesDetenida).toBe(clasesNormal);
    expect(cifraDetenida).toBe(cifraNormal);
    expect(clasesDetenida).toContain(FASE_PALETA.revisada.trazo);
    expect(cifraDetenida).toContain(FASE_PALETA.revisada.trazo);
    // Lo único que las separa es la forma de la pista.
    expect(pistaDetenida).toBe("punteada");
    expect(pistaNormal).toBe("continua");
  });
});

describe("FaseCell — la cifra, ya fuera del anillo", () => {
  it("se ve en las cuatro fases del carril, incluida aplicada", () => {
    const casos: Array<[Partial<VentaLocal>, string]> = [
      [{ SITUACION: "borrador" }, "1"],
      [{ SITUACION: "revisada" }, "2"],
      [{ SITUACION: "aprobada" }, "3"],
      [{ SINCRONIZACION: "aplicada" }, "4"],
    ];

    for (const [parche, esperado] of casos) {
      const { unmount } = render(<FaseCell venta={{ ...VENTA, ...parche }} />);
      const cifra = screen.getByTestId("fase-cifra");
      expect(cifra).toHaveTextContent(esperado);
      expect(screen.getByTestId("fase-anillo").querySelector("text")).toBeNull();
      unmount();
    }
  });

  it("una salida del carril lleva raya em atenuada", () => {
    render(<FaseCell venta={{ ...VENTA, SITUACION: "cancelada" }} />);

    const cifra = screen.getByTestId("fase-cifra");
    expect(cifra).toHaveTextContent("—");
    expect(cifra.className).toContain("text-muted-foreground");
  });

  it("cada fase del carril pinta la cifra con la clase de la paleta compartida", () => {
    for (const [parche, clave] of DEL_CARRIL) {
      const { unmount } = render(<FaseCell venta={{ ...VENTA, ...parche }} />);

      const clases = screen.getByTestId("fase-cifra").className;
      expect(clases).toContain(FASE_PALETA[clave].trazo);
      for (const token of TOKENS_MUERTOS) expect(clases).not.toContain(token);

      unmount();
    }
  });

  it("la cifra y el aro salen de la misma entrada de la paleta", () => {
    for (const [parche, clave] of DEL_CARRIL) {
      const { unmount } = render(<FaseCell venta={{ ...VENTA, ...parche }} />);

      const tono = FASE_PALETA[clave].trazo;
      expect(screen.getByTestId("fase-cifra").className).toContain(tono);
      expect(screen.getByTestId("fase-anillo").getAttribute("class")).toContain(tono);

      unmount();
    }
  });

  it("estar detenida no le cambia el color a la cifra", () => {
    render(
      <FaseCell
        venta={{ ...VENTA, FASE_DESDE: new Date(AHORA.getTime() - 6 * MS_POR_DIA).toISOString() }}
      />
    );

    // VENTA está aprobada: la cifra va en cielo, como el aro. Que lleve seis
    // días parada se ve en la pista punteada, no en el hue.
    const clases = screen.getByTestId("fase-cifra").className;
    expect(clases).toContain(FASE_PALETA.aprobada.trazo);
    expect(clases).not.toContain("amber");
    for (const token of TOKENS_MUERTOS) expect(clases).not.toContain(token);
  });

  it("en compacta la cifra se queda afuera del anillo", () => {
    render(<FaseCell compact venta={{ ...VENTA, SITUACION: "revisada" }} />);

    expect(screen.getByTestId("fase-anillo")).toHaveAttribute("width", "18");
    expect(screen.getByTestId("fase-cifra")).toHaveTextContent("2");
  });

  it("una cancelada dibuja el avance que traiga fase_alcanzada", () => {
    render(
      <FaseCell venta={{ ...VENTA, SITUACION: "cancelada", FASE_ALCANZADA: 2 }} />
    );

    const anillo = screen.getByTestId("fase-anillo");
    expect(anillo).toHaveAttribute("data-arcos", "2");
    expect(anillo).toHaveAttribute("data-tono", "fuera");
    expect(screen.getByText("llegó a revisada")).toBeInTheDocument();
  });
});

describe("FaseCell — el panel", () => {
  it("no pide los eventos mientras el panel está cerrado", () => {
    render(<FaseCell venta={VENTA} />);

    expect(mockUseVentaEventos).not.toHaveBeenCalled();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("se abre con el teclado y entonces sí pide los eventos", () => {
    render(<FaseCell venta={VENTA} />);

    fireEvent.focus(celda());

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(mockUseVentaEventos).toHaveBeenCalledWith(VENTA.LOCAL_SALE_ID);
    expect(celda()).toHaveAttribute("aria-expanded", "true");
  });

  it("la celda puede recibir foco", () => {
    render(<FaseCell venta={VENTA} />);

    expect(celda()).toHaveAttribute("tabindex", "0");
  });

  it("Escape cierra el panel abierto con teclado", () => {
    render(<FaseCell venta={VENTA} />);

    fireEvent.focus(celda());
    fireEvent.keyDown(celda(), { key: "Escape" });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("el cursor tiene que detenerse: pasar de largo no pide nada", () => {
    render(<FaseCell venta={VENTA} />);

    fireEvent.mouseEnter(celda());
    act(() => {
      vi.advanceTimersByTime(80);
    });
    fireEvent.mouseLeave(celda());
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockUseVentaEventos).not.toHaveBeenCalled();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("al detenerse el cursor abre el panel", () => {
    render(<FaseCell venta={VENTA} />);

    fireEvent.mouseEnter(celda());
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("cerrar el panel desmonta el hook — la petición en vuelo se aborta", () => {
    render(<FaseCell venta={VENTA} />);

    fireEvent.focus(celda());
    expect(mockUseVentaEventos).toHaveBeenCalled();

    fireEvent.blur(celda());
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("muestra el estado de carga", () => {
    mockUseVentaEventos.mockReturnValue({ eventos: [], isLoading: true, error: null });
    render(<FaseCell venta={VENTA} />);

    fireEvent.focus(celda());

    expect(screen.getByText("Cargando bitácora")).toBeInTheDocument();
  });

  it("explica el error en vez de disculparse", () => {
    mockUseVentaEventos.mockReturnValue({
      eventos: [],
      isLoading: false,
      error: "el servidor no respondió",
    });
    render(<FaseCell venta={VENTA} />);

    fireEvent.focus(celda());

    expect(screen.getByText("No se pudo leer la bitácora")).toBeInTheDocument();
    expect(screen.getByText("el servidor no respondió")).toBeInTheDocument();
  });

  it("dibuja la bitácora real, con el hito pendiente sin fecha", () => {
    mockUseVentaEventos.mockReturnValue({
      eventos: [
        evento("venta.creada", "2026-08-12T11:04:00Z"),
        evento("venta.enviada_a_revision", "2026-08-12T18:22:00Z"),
        evento("venta.aprobada", "2026-08-12T19:40:00Z"),
      ],
      isLoading: false,
      error: null,
    });
    render(
      <FaseCell
        venta={{ ...VENTA, FASE_DESDE: new Date(AHORA.getTime() - 6 * MS_POR_DIA).toISOString() }}
      />
    );

    fireEvent.focus(celda());

    const panel = screen.getByRole("tooltip");
    expect(panel).toHaveTextContent("Capturada");
    expect(panel).toHaveTextContent("Aplicada en Microsip");
    expect(panel).toHaveTextContent("—");
    // El hito donde se quedó lleva los días detenida.
    expect(panel).toHaveTextContent("· 6 d");
  });
});

describe("El ámbar de detenida no sobrevive en ningún rincón", () => {
  const EXTENSIONES = new Set([".ts", ".tsx", ".css"]);

  /** Todo el árbol de `src/`, más la configuración de Tailwind. */
  const archivosRevisables = (): string[] => {
    const raiz = resolve(process.cwd(), "src");
    const relativas = readdirSync(raiz, { recursive: true, encoding: "utf8" });

    return [
      ...relativas
        .filter((relativa) => EXTENSIONES.has(extname(relativa)))
        .map((relativa) => join(raiz, relativa)),
      resolve(process.cwd(), "tailwind.config.js"),
    ];
  };

  it("ninguno de los dos tokens queda declarado ni usado", () => {
    const rutas = archivosRevisables();
    // Si el barrido dejara de encontrar archivos, pasaría en vacío y mentiría.
    expect(rutas.length).toBeGreaterThan(100);

    const culpables = rutas.filter((ruta) => {
      const fuente = readFileSync(ruta, "utf8");
      return TOKENS_MUERTOS.some((token) => fuente.includes(token));
    });

    expect(culpables).toEqual([]);
  });
});
