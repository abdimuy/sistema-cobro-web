import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { SeleccionarZonaCombobox } from "@/modules/ventasLocales/components/EditarVentaModal/piezas/SeleccionarZonaCombobox";

/**
 * La regla que este archivo protege
 * =================================
 *
 * Un desplegable con buscador (un panel que lleva <CommandInput> adentro) mide
 * **exactamente** lo que mide el disparador que lo abre. Nada de anchos fijos:
 * con `w-[280px]` el panel salía más angosto que el campo y quedaba
 * visiblemente desalineado debajo de él.
 *
 * Radix publica el ancho del disparador como variable CSS en el contenido, y
 * **la variable no es la misma en las dos familias**:
 *
 *   - Popover → `--radix-popover-trigger-width`
 *   - Select  → `--radix-select-trigger-width`
 *
 * Usar la de la otra familia deja el `w-[var(…)]` sin resolver y el panel
 * colapsa — el mismo modo de fallo que un `hsl()` sin su variable, que ya
 * mordió en este repo. Por eso el barrido de abajo revisa las dos cosas: que
 * el ancho salga del disparador y que la variable sea la de su familia.
 *
 * QUÉ CUBRE ESTE BARRIDO
 * ----------------------
 *  - Todo `.tsx` bajo `src/` que no sea un test.
 *  - Sólo los paneles CON buscador: `<PopoverContent>` / `<SelectContent>` que
 *    contienen un `<CommandInput>`. Ese es el universo del que se quejó el
 *    dueño: "el buscador siempre tiene un tamaño igual en todos".
 *
 * QUÉ **NO** CUBRE, a propósito
 * -----------------------------
 *  - Los popovers colgados de un botón de barra: filtros, campana de
 *    notificaciones, calendarios, el editor del chip de vendedor, y los dos
 *    selectores de columnas —`VentasColumnSelector` trae su propio buscador,
 *    con un `<Input>` en vez de un `<CommandInput>`, y aun así queda fuera—.
 *    Sus disparadores son botones de icono de ~90 px: heredar ese ancho los
 *    dejaría inservibles. Su ancho fijo es deliberado y sigue permitido. Ese
 *    es justo el motivo de que el barrido se ancle a `<CommandInput>` y no a
 *    "cualquier caja de búsqueda": el corte es el desplegable de un campo, no
 *    el panel de una barra de herramientas.
 *  - Los `<Select>` de Radix sin buscador. Su panel ya nace con
 *    `min-w-[var(--radix-select-trigger-width)]` en `ui/select.tsx`, así que
 *    nunca sale más angosto que el campo.
 *  - El ancho REAL en píxeles: jsdom no hace layout. La prueba de render de más
 *    abajo demuestra que la clase llega al elemento pintado; el tamaño que
 *    produce el navegador queda fuera de su alcance.
 *  - Un `className` armado por completo en una variable o prop, sin literales
 *    de texto en el JSX: el barrido lo ve como panel sin clases y falla, que es
 *    el lado seguro del error.
 */

const CLASE_POPOVER = "w-[var(--radix-popover-trigger-width)]";
const CLASE_SELECT = "w-[var(--radix-select-trigger-width)]";

/**
 * Los paneles con buscador que existen hoy. Si alguien agrega uno, la cuenta
 * sube y esta lista se queda corta a propósito: el barrido exige que todos los
 * que encuentre cumplan la regla, y esta constante sólo evita que un barrido
 * roto pase en vacío y mienta.
 */
const PANELES_CONOCIDOS = 6;

// ─── El barrido de archivos ───────────────────────────────────────────────────

const archivosDeApp = (): string[] => {
  const raiz = resolve(process.cwd(), "src");
  const relativas = readdirSync(raiz, { recursive: true, encoding: "utf8" });

  return relativas
    .filter((ruta) => extname(ruta) === ".tsx")
    .filter((ruta) => !/\.(test|spec)\.tsx$/.test(ruta))
    .map((ruta) => join(raiz, ruta));
};

/** Fin de la etiqueta de apertura: el primer `>` fuera de comillas y de `{}`. */
const finDeApertura = (fuente: string, desde: number): number => {
  let profundidad = 0;
  let comilla: string | null = null;

  for (let i = desde; i < fuente.length; i++) {
    const c = fuente[i];

    if (comilla !== null) {
      if (c === comilla) comilla = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      comilla = c;
      continue;
    }
    if (c === "{") profundidad++;
    else if (c === "}") profundidad--;
    else if (c === ">" && profundidad === 0) return i;
  }
  return -1;
};

/**
 * Las clases declaradas en la etiqueta. Junta todos los literales de texto del
 * `className`, así funciona igual con `className="…"` y con `className={cn("…",
 * cond && "…")}`.
 */
const clasesDe = (apertura: string): string => {
  const marca = apertura.indexOf("className=");
  if (marca === -1) return "";

  const resto = apertura.slice(marca + "className=".length).trimStart();
  if (resto.startsWith('"') || resto.startsWith("'")) {
    const cierre = resto.indexOf(resto[0], 1);
    return cierre === -1 ? "" : resto.slice(1, cierre);
  }
  return (resto.match(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g) ?? [])
    .map((literal) => literal.slice(1, -1))
    .join(" ");
};

interface Panel {
  archivo: string;
  linea: number;
  componente: "PopoverContent" | "SelectContent";
  clases: string;
  conBuscador: boolean;
}

const panelesEn = (archivo: string, fuente: string): Panel[] => {
  const encontrados: Panel[] = [];

  for (const componente of ["PopoverContent", "SelectContent"] as const) {
    const abre = new RegExp(`<${componente}(?=[\\s/>])`, "g");
    let m: RegExpExecArray | null;

    while ((m = abre.exec(fuente)) !== null) {
      const fin = finDeApertura(fuente, m.index);
      if (fin === -1) continue;

      const apertura = fuente.slice(m.index, fin + 1);
      const cierre = fuente.indexOf(`</${componente}>`, fin);
      const cuerpo = apertura.endsWith("/>")
        ? ""
        : cierre === -1
          ? fuente.slice(fin + 1)
          : fuente.slice(fin + 1, cierre);

      encontrados.push({
        archivo,
        linea: fuente.slice(0, m.index).split("\n").length,
        componente,
        clases: clasesDe(apertura),
        conBuscador: cuerpo.includes("<CommandInput"),
      });
    }
  }

  return encontrados;
};

/** Toda utilidad de ancho declarada, con o sin prefijo responsivo/de estado. */
const anchosDeclarados = (clases: string): string[] =>
  clases
    .split(/\s+/)
    .filter((clase) => clase !== "")
    .filter((clase) => /^(?:[\w-]+(?:\[[^\]]*\])?:)*(?:min-|max-)?w-/.test(clase));

const todosLosPaneles = (): Panel[] =>
  archivosDeApp().flatMap((archivo) =>
    panelesEn(relative(process.cwd(), archivo), readFileSync(archivo, "utf8")),
  );

const rotulo = (panel: Panel) => `${panel.archivo}:${panel.linea}`;

// ─── Las pruebas ──────────────────────────────────────────────────────────────

describe("El barrido llega a donde dice", () => {
  it("recorre el árbol completo de .tsx de la app", () => {
    // Si el barrido dejara de encontrar archivos, todo lo demás pasaría en
    // vacío y mentiría.
    expect(archivosDeApp().length).toBeGreaterThan(100);
  });

  it("encuentra los desplegables con buscador que existen", () => {
    const conBuscador = todosLosPaneles().filter((p) => p.conBuscador);

    expect(conBuscador.length).toBeGreaterThanOrEqual(PANELES_CONOCIDOS);
  });

  it("también ve los paneles sin buscador, que quedan fuera de la regla", () => {
    // Control del propio barrido: si sólo viera paneles con buscador, no
    // estaría distinguiendo nada — estaría ciego a la mitad del universo.
    expect(todosLosPaneles().some((p) => !p.conBuscador)).toBe(true);
  });
});

describe("Un desplegable con buscador mide lo que su disparador", () => {
  it("ninguno declara un ancho fijo", () => {
    const permitido = new Set([CLASE_POPOVER, CLASE_SELECT]);

    const culpables = todosLosPaneles()
      .filter((panel) => panel.conBuscador)
      .flatMap((panel) =>
        anchosDeclarados(panel.clases)
          .filter((ancho) => !permitido.has(ancho))
          .map((ancho) => `${rotulo(panel)} → ${ancho}`),
      );

    expect(culpables).toEqual([]);
  });

  it("todos heredan el ancho del disparador, y ninguno se queda sin declararlo", () => {
    const sinHeredar = todosLosPaneles()
      .filter((panel) => panel.conBuscador)
      .filter((panel) => !anchosDeclarados(panel.clases).some((a) => a.startsWith("w-[var(")))
      .map(rotulo);

    expect(sinHeredar).toEqual([]);
  });
});

describe("Cada familia usa la variable de su familia", () => {
  it("un panel de Popover con buscador usa --radix-popover-trigger-width", () => {
    const equivocados = todosLosPaneles()
      .filter((panel) => panel.conBuscador && panel.componente === "PopoverContent")
      .filter((panel) => !panel.clases.includes(CLASE_POPOVER))
      .map(rotulo);

    expect(equivocados).toEqual([]);
  });

  it("un panel de Select con buscador usa --radix-select-trigger-width", () => {
    const equivocados = todosLosPaneles()
      .filter((panel) => panel.conBuscador && panel.componente === "SelectContent")
      .filter((panel) => !panel.clases.includes(CLASE_SELECT))
      .map(rotulo);

    expect(equivocados).toEqual([]);
  });

  it("nadie cruza las variables: la de la otra familia no resuelve y colapsa el panel", () => {
    const cruzados = todosLosPaneles()
      .filter((panel) =>
        panel.componente === "PopoverContent"
          ? panel.clases.includes("--radix-select-trigger-width")
          : panel.clases.includes("--radix-popover-trigger-width"),
      )
      .map(rotulo);

    expect(cruzados).toEqual([]);
  });
});

describe("La clase llega al panel pintado, no sólo al archivo", () => {
  it("el panel abierto lleva el ancho del disparador y ningún ancho propio", () => {
    render(
      <SeleccionarZonaCombobox
        value={null}
        onChange={() => {}}
        zonas={[{ id: 7, nombre: "TEHUACÁN CENTRO" }]}
      />,
    );

    fireEvent.click(screen.getByRole("button"));

    const buscador = screen.getByPlaceholderText("Buscar zona...");
    const panel = buscador.closest("[data-radix-popper-content-wrapper] > *");
    expect(panel).not.toBeNull();

    const clases = panel?.getAttribute("class") ?? "";
    expect(clases).toContain(CLASE_POPOVER);
    // `ui/popover.tsx` trae un `w-72` de fábrica: si el `cn()` dejara de
    // ganarle, el panel volvería a los 288 px fijos sin que nadie se entere.
    expect(anchosDeclarados(clases)).toEqual([CLASE_POPOVER]);
  });
});
