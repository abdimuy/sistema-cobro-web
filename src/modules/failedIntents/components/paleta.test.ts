import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ACENTO_BORDE,
  ACENTO_BOTON,
  ACENTO_PILDORA,
  ACENTO_TEXTO,
  LINEA,
  SUPERFICIE,
  SUPERFICIE_2,
  SUPERFICIE_2_HOVER,
  TEXTO_2,
} from "./paleta";

/**
 * El barrido de la paleta: la pantalla de intentos fallidos nació calcada del
 * mock, y con el mock se copiaron sus colores a mano —#FBF9F6 de fondo,
 * #A33A2A de acento, #F7E7E2 de píldora—. Se veía bien sola y desentonaba al
 * llegar navegando desde Ventas o Cartera.
 *
 * Estas pruebas vigilan que no vuelvan. No comparan cómo se ve la pantalla:
 * comparan de dónde salen sus colores.
 */

/**
 * Los archivos que esta reescritura convirtió al sistema de la app.
 *
 * La lista es explícita y no un barrido de `components/` a propósito. Hay
 * archivos que el plan conserva intactos —`multipartEditor/` (925 líneas),
 * `ventaReplayForm/` (555)— y meterlos aquí convertiría esta prueba en una
 * orden de reescribirlos, que es exactamente la decisión que se tomó al revés.
 * Cuando alguno se migre, se agrega su ruta y la prueba lo empieza a cuidar.
 */
const ARCHIVOS_MIGRADOS = [
  "paleta.ts",
  "FailedIntentsScreen.tsx",
  "IntentoCard.tsx",
  "IntentosTranquilos.tsx",
  "FiltroChips.tsx",
  "Inspector.tsx",
  "Evidencia.tsx",
  "BodyViewer.tsx",
  "badges/StatusBadge.tsx",
  "badges/IntentKindBadge.tsx",
];

const fuente = (relativa: string): string =>
  readFileSync(resolve(__dirname, relativa), "utf8");

/**
 * El mismo archivo, sin sus comentarios.
 *
 * Hace falta porque los comentarios de esta pantalla CITAN a propósito lo que
 * está prohibido —los hex del mock, el `var(--card)` que no pinta— para
 * explicar de dónde viene la regla. Un comentario no pinta nada, y una prueba
 * que se tropieza con su propia documentación obliga a borrar la explicación
 * para pasar, que es el peor arreglo posible.
 */
const codigo = (relativa: string): string =>
  fuente(relativa)
    .split("\n")
    .filter((l) => {
      const t = l.trimStart();
      return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
    })
    .join("\n");

/**
 * Los hex que trajo el mock. Se arman por piezas: escritos completos, el
 * barrido se encontraría a sí mismo en este archivo y nunca podría fallar.
 */
const HEX_DEL_MOCK = [
  ["FBF", "9F6"], // ground
  ["A33", "A2A"], // attention claro
  ["E38", "B76"], // attention oscuro
  ["F7E", "7E2"], // attention-bg claro
  ["2E1", "B16"], // attention-bg oscuro
  ["2A1", "00A"], // texto sobre el botón primario oscuro
  ["E2D", "BD2"], // line
  ["CFC", "5B9"], // line-strong
].map(([a, b]) => `#${a}${b}`);

describe("La paleta del mock no sobrevive en los archivos migrados", () => {
  it("ningún hex del mock queda escrito a mano", () => {
    // Sin este control la prueba pasaría en vacío si alguien renombra un
    // archivo y la lista deja de resolver.
    expect(ARCHIVOS_MIGRADOS.length).toBeGreaterThan(5);

    const culpables: string[] = [];
    for (const archivo of ARCHIVOS_MIGRADOS) {
      const enCodigo = codigo(archivo);
      for (const hex of HEX_DEL_MOCK) {
        if (enCodigo.includes(hex)) culpables.push(`${archivo}: ${hex}`);
      }
    }
    expect(culpables).toEqual([]);
  });

  it("ninguna clase de la escala zinc queda suelta", () => {
    // `zinc-*` es la escala neutra que la pantalla usaba en vez de los tokens
    // del tema. No es un hex, pero esquiva el sistema igual: cambiar el gris
    // de la app no cambiaba esta pantalla.
    const marca = ["zi", "nc-"].join("");
    const culpables = ARCHIVOS_MIGRADOS.filter((a) => codigo(a).includes(marca));
    expect(culpables).toEqual([]);
  });

  it("nunca se escribe var(--x) sin envolver en hsl()", () => {
    // La trampa de este repo: los tokens guardan sólo los tres canales HSL
    // ("0 0% 100%"), así que `var(--card)` es CSS inválido y no pinta. Compila,
    // pasa la revisión, y deja una columna transparente que nadie nota.
    const culpables: string[] = [];
    for (const archivo of ARCHIVOS_MIGRADOS) {
      const texto = codigo(archivo);
      for (const m of texto.matchAll(/var\(--[a-z0-9-]+\)/g)) {
        const antes = texto.slice(Math.max(0, m.index - 4), m.index);
        if (!antes.endsWith("hsl(")) culpables.push(`${archivo}: ${m[0]}`);
      }
    }
    expect(culpables).toEqual([]);
  });
});

describe("Las constantes de la paleta son clases COMPLETAS", () => {
  // Tailwind escanea el código fuente buscando clases completas. Una clase
  // compuesta en tiempo de ejecución —`hover:${SUPERFICIE_2}`— no existe en el
  // CSS generado: compila y no pinta. Que cada constante sea la clase entera
  // es lo que permite usarlas dentro de plantillas sin caer en eso.
  const TODAS = {
    ACENTO_BORDE,
    ACENTO_TEXTO,
    ACENTO_PILDORA,
    ACENTO_BOTON,
    SUPERFICIE,
    SUPERFICIE_2,
    SUPERFICIE_2_HOVER,
    LINEA,
    TEXTO_2,
  };

  it.each(Object.entries(TODAS))("%s no lleva interpolación ni queda a medias", (_n, valor) => {
    expect(valor).not.toContain("${");
    // Una clase que termina en `:` es media clase — el prefijo sin la utilidad.
    for (const clase of valor.split(/\s+/)) {
      expect(clase.endsWith(":")).toBe(false);
      expect(clase.length).toBeGreaterThan(0);
    }
  });

  it("el acento sale del token del tema en claro", () => {
    for (const clase of [ACENTO_BORDE, ACENTO_TEXTO, ACENTO_PILDORA, ACENTO_BOTON]) {
      expect(clase).toContain("destructive");
    }
  });

  it("todo lo que pinta TEXTO con el acento trae variante oscura", () => {
    // `--destructive` en tema oscuro es un rojo OSCURO: está pensado como
    // relleno, con `--destructive-foreground` encima. Como color de texto
    // sobre una superficie oscura queda ilegible — se vio al correr la
    // pantalla, no al compilarla. El botón sólido es la excepción legítima:
    // ahí el token SÍ es el relleno.
    for (const clase of [ACENTO_TEXTO, ACENTO_PILDORA]) {
      expect(clase, `sin variante dark: ${clase}`).toMatch(/dark:text-/);
    }
    expect(ACENTO_BOTON).toContain("text-destructive-foreground");
  });

  it("ninguna constante compone un prefijo sobre otra", () => {
    // `SUPERFICIE_2_HOVER` existe justo para no tener que escribir
    // `hover:${SUPERFICIE_2}`. Si alguien lo definiera así, esto lo caza.
    expect(codigo("paleta.ts")).not.toMatch(/`[^`]*:\$\{/);
  });
});
