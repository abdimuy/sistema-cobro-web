import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { VentaLocal } from "@/services/api/getVentasLocales";
import type { VentaV2 } from "@/services/api/ventaV2Types";

import { FaseCell } from "./FaseCell";
import { FASE_PALETA } from "./fasePaleta";
import VentaWorkflowTimeline from "./detalle/VentaWorkflowTimeline";

/**
 * El punto de esta prueba: la paleta de fases vive en UN lugar y la consumen
 * los dos dibujos —la línea de tiempo del detalle y el anillo de la tabla—.
 * Si mañana alguien cambia el azul de "aprobada" en un solo sitio, aquí se cae.
 */

const RUTA_LINEA_DE_TIEMPO =
  "src/modules/ventasLocales/components/detalle/VentaWorkflowTimeline.tsx";
const RUTA_ANILLO = "src/modules/ventasLocales/components/FaseAnillo.tsx";

const fuenteDe = (ruta: string) => readFileSync(resolve(process.cwd(), ruta), "utf8");

const VENTA_LOCAL: VentaLocal = {
  LOCAL_SALE_ID: "9d41b0c8-5f2a-4d77-9b31-6ac0e2f81d54",
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

function ventaV2(overrides: Partial<VentaV2> = {}): VentaV2 {
  return {
    id: "9d41b0c8-5f2a-4d77-9b31-6ac0e2f81d54",
    cliente: {
      cliente_id: null,
      nombre: "Eleazar Alva Rojas",
      telefono: null,
      aval: null,
      referencia: null,
    },
    direccion: {
      calle: "Av. Independencia",
      numero_exterior: "214",
      colonia: "Centro",
      poblacion: "Tehuacán",
      ciudad: "Tehuacán",
      zona_cliente_id: null,
    },
    gps: { latitud: 18.36, longitud: -97.4 },
    fecha_venta: "2026-08-12T15:04:00Z",
    tipo_venta: "CREDITO",
    estado: "active",
    situacion: "aprobada",
    sincronizacion: "pendiente",
    microsip_folio: null,
    microsip_docto_pv_id: null,
    microsip_aplicada_at: null,
    montos: { anual: "21450", corto_plazo: "0", contado: "0" },
    plan_credito: null,
    dia_cobranza: null,
    nota: null,
    combos: [],
    productos: [],
    vendedores: [],
    imagenes: [],
    cancelacion: null,
    aprobacion: null,
    created_at: "2026-08-12T15:04:00Z",
    updated_at: "2026-08-12T16:40:00Z",
    created_by: "e45ef599-7bc4-4df0-a256-23de460a959e",
    updated_by: "e45ef599-7bc4-4df0-a256-23de460a959e",
    ...overrides,
  };
}

const flujo = () => screen.getByLabelText("Flujo de aprobación");

describe("La paleta de fases vive en un solo lugar", () => {
  it("la línea de tiempo del detalle pinta con la paleta compartida", () => {
    render(<VentaWorkflowTimeline venta={ventaV2({ situacion: "aprobada" })} />);

    const html = flujo().innerHTML;
    // Pasos ya recorridos: el círculo relleno de cada fase.
    expect(html).toContain(FASE_PALETA.borrador.bg);
    expect(html).toContain(FASE_PALETA.revisada.bg);
    // Paso en curso: contorno y halo de su fase.
    expect(html).toContain(FASE_PALETA.aprobada.border);
    expect(html).toContain(FASE_PALETA.aprobada.halo);
  });

  it("la línea de tiempo ya no declara su propia copia de la paleta", () => {
    const fuente = fuenteDe(RUTA_LINEA_DE_TIEMPO);

    expect(fuente).toContain('from "../fasePaleta"');
    // Ni un solo tono suelto: si vuelve a aparecer aquí, volvieron las copias.
    for (const literal of [
      "amber-500",
      "amber-600",
      "amber-700",
      "sky-500",
      "sky-600",
      "sky-700",
      "emerald-500",
      "emerald-600",
      "emerald-700",
    ]) {
      expect(fuente).not.toContain(literal);
    }
  });

  it("el anillo tampoco: toma el color de la misma paleta", () => {
    const fuente = fuenteDe(RUTA_ANILLO);

    expect(fuente).toContain('from "./fasePaleta"');
    // El único color que se escribe a mano es la pista, que no es de fase: si
    // apareciera cualquier otro token, volvió una paleta paralela.
    expect(fuente.match(/hsl\(var\(--fase-[a-z-]+\)\)/g)).toEqual([
      "hsl(var(--fase-pista))",
    ]);
  });

  it("el anillo y la línea de tiempo usan el mismo tono para la misma fase", () => {
    render(<VentaWorkflowTimeline venta={ventaV2({ situacion: "aprobada" })} />);
    // La línea de tiempo pinta "aprobada" con el relleno de la paleta…
    expect(flujo().innerHTML).toContain(FASE_PALETA.aprobada.bg);

    render(<FaseCell venta={{ ...VENTA_LOCAL, SITUACION: "aprobada" }} />);
    // …y el anillo, con el trazo de la MISMA entrada de la MISMA paleta.
    expect(screen.getByTestId("fase-anillo").getAttribute("class")).toContain(
      FASE_PALETA.aprobada.trazo
    );

    // Mismo hue, escrito una sola vez: `bg-sky-500` y `text-sky-500`.
    expect(FASE_PALETA.aprobada.trazo).toBe(
      FASE_PALETA.aprobada.bg.replace(/^bg-/, "text-")
    );
  });
});
