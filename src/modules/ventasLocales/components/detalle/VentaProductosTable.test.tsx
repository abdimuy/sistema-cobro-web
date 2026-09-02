import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import VentaProductosTable from "./VentaProductosTable";
import type { VentaV2 } from "@/services/api/ventaV2Types";

// El caso que hizo falta esta pantalla, medido en producción:
//
// Una venta de 8 sillas llegó con el precio de contado CINCO VECES el anual.
// Quien capturó puso el total de las ocho ($7,700) en contado y en corto
// plazo, y el unitario ($1,400) en anual. El servidor multiplica los tres por
// la cantidad, así que la venta quedó con $61,600 de contado sobre una deuda
// de $11,200 — y eso se escribió en Microsip, donde alimenta el "Hoy liquida
// con" del cobrador y el ticket.
//
// La pantalla no calculaba mal. Usaba la palabra "CONTADO" para un unitario
// (esta tabla) y para un total (el encabezado) sin decir cuál era cuál, y
// sólo mostraba el subtotal del nivel que la venta cobra. El $61,600 no
// aparecía en ningún lado, así que el capturista no tenía cómo ver la
// incoherencia.

const UNITARIO_CONTADO = "7700.00";
const UNITARIO_CORTO = "7700.00";
const UNITARIO_ANUAL = "1400.00";

function makeVenta(overrides: Partial<VentaV2> = {}): VentaV2 {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    cliente: {
      cliente_id: null,
      nombre: "Cliente Demo",
      telefono: null,
      aval: null,
      referencia: null,
    },
    direccion: {
      calle: "Calle",
      numero_exterior: "12",
      colonia: "Centro",
      poblacion: "Pueblo",
      ciudad: "Ciudad",
      zona_cliente_id: 1,
    },
    gps: { latitud: 0, longitud: 0 },
    fecha_venta: "2026-09-02T00:38:00Z",
    tipo_venta: "CREDITO",
    estado: "active",
    situacion: "aprobada",
    sincronizacion: "pendiente",
    microsip_folio: null,
    microsip_docto_pv_id: null,
    microsip_aplicada_at: null,
    montos: { anual: "11200", corto_plazo: "61600", contado: "61600" },
    plan_credito: null,
    dia_cobranza: null,
    nota: null,
    combos: [],
    productos: [
      {
        id: "22222222-2222-2222-2222-222222222222",
        articulo_id: 4210,
        articulo: "SILLA MADERA",
        cantidad: "8",
        precio_anual: UNITARIO_ANUAL,
        precio_corto: UNITARIO_CORTO,
        precio_contado: UNITARIO_CONTADO,
        combo_id: null,
        almacen_origen_id: 1,
        almacen_destino_id: 2,
      },
    ],
    vendedores: [],
    imagenes: [],
    cancelacion: null,
    aprobacion: null,
    created_at: "2026-09-02T00:38:00Z",
    updated_at: "2026-09-02T00:38:00Z",
    created_by: "e45ef599-7bc4-4df0-a256-23de460a959e",
    updated_by: "e45ef599-7bc4-4df0-a256-23de460a959e",
    ...overrides,
  } as unknown as VentaV2;
}

// ─── Lectura por columna ─────────────────────────────────────────────────────
//
// Preguntar "¿aparece este texto en este <tr>?" no comprueba NADA sobre las
// columnas. Un precio pintado bajo el nivel equivocado —exactamente el defecto
// que esta pantalla existe para hacer visible— pasa desapercibido. Medido:
// intercambiando `contado` y `corto` en `tierValue`, las seis pruebas de este
// archivo seguían en verde, y la suite entera también.
//
// Estos helpers atan cada número a SU columna. El mapeo nivel→columna se LEE
// del encabezado en vez de escribirse a mano: si alguien reordena las
// columnas, el mapeo se recalcula solo y las aserciones siguen comprobando el
// nivel y no la posición.

type ColumnasDeNivel = { unitario: number; importe: number };

/** Mapa nivel → índices de columna, deducido del primer piso del encabezado. */
function columnasPorNivel(): Record<string, ColumnasDeNivel> {
  const filaDeNiveles = screen
    .getByText("Descripción")
    .closest("tr") as HTMLTableRowElement;

  const mapa: Record<string, ColumnasDeNivel> = {};
  let columna = 0;
  for (const celda of Array.from(filaDeNiveles.cells)) {
    const ancho = celda.colSpan || 1;
    // Los niveles son los encabezados que agrupan dos columnas: unitario e
    // importe. Los de una sola (Descripción, Cant.) no son niveles.
    if (ancho === 2) {
      mapa[celda.textContent?.trim() ?? ""] = {
        unitario: columna,
        importe: columna + 1,
      };
    }
    columna += ancho;
  }
  return mapa;
}

/**
 * Las celdas de una fila indexadas por COLUMNA: expande los `colSpan` para que
 * el índice del arreglo sea el de la columna y no el de la celda.
 */
function celdasPorColumna(fila: HTMLTableRowElement): HTMLTableCellElement[] {
  const porColumna: HTMLTableCellElement[] = [];
  for (const celda of Array.from(fila.cells)) {
    for (let i = 0; i < (celda.colSpan || 1); i++) porColumna.push(celda);
  }
  return porColumna;
}

/** Las celdas, por columna, de la fila que contiene `texto`. */
function filaDe(texto: string): HTMLTableCellElement[] {
  return celdasPorColumna(
    screen.getByText(texto).closest("tr") as HTMLTableRowElement,
  );
}

describe("VentaProductosTable — unitario contra importe", () => {
  it("distingue el precio unitario del importe en los encabezados", () => {
    render(<VentaProductosTable venta={makeVenta()} />);

    // Tres niveles × (unitario, importe). Sin estas etiquetas, "Contado"
    // nombra lo mismo aquí y en el encabezado, donde es un total.
    expect(screen.getAllByText("P. unitario")).toHaveLength(3);
    expect(screen.getAllByText("Importe")).toHaveLength(3);
  });

  it("muestra el importe de los TRES niveles por renglón, no sólo el que se cobra", () => {
    render(<VentaProductosTable venta={makeVenta()} />);
    const col = columnasPorNivel();
    const fila = filaDe("SILLA MADERA");

    // El $61,600 de contado tiene que estar BAJO LA COLUMNA de contado, junto
    // al $11,200 de anual: es lo único que deja ver que un precio va cinco
    // veces sobre el otro.
    expect(fila[col["Contado"].unitario]).toHaveTextContent("$7,700");
    expect(fila[col["Contado"].importe]).toHaveTextContent("$61,600");
    expect(fila[col["Corto plazo"].unitario]).toHaveTextContent("$7,700");
    expect(fila[col["Corto plazo"].importe]).toHaveTextContent("$61,600");
    expect(fila[col["Anual"].unitario]).toHaveTextContent("$1,400");
    expect(fila[col["Anual"].importe]).toHaveTextContent("$11,200");
  });

  it("totaliza los tres niveles al pie, cada uno bajo su columna", () => {
    render(<VentaProductosTable venta={makeVenta()} />);
    const col = columnasPorNivel();
    const pie = filaDe("Total");

    expect(pie[col["Contado"].importe]).toHaveTextContent("$61,600");
    expect(pie[col["Corto plazo"].importe]).toHaveTextContent("$61,600");
    expect(pie[col["Anual"].importe]).toHaveTextContent("$11,200");
  });

  it("el combo aporta su importe y sus piezas no aportan ninguno", () => {
    const venta = makeVenta({
      productos: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          articulo_id: 900,
          articulo: "SOFA",
          cantidad: "1",
          precio_anual: "0",
          precio_corto: "0",
          precio_contado: "0",
          combo_id: "44444444-4444-4444-4444-444444444444",
          almacen_origen_id: null,
          almacen_destino_id: null,
        },
      ],
      combos: [
        {
          id: "44444444-4444-4444-4444-444444444444",
          nombre: "SALA 3 PIEZAS",
          precio_anual: "5000",
          precio_corto: "4500",
          precio_contado: "4000",
          cantidad: "2",
          almacen_origen_id: 1,
          almacen_destino_id: 2,
        },
      ],
    } as unknown as Partial<VentaV2>);
    render(<VentaProductosTable venta={venta} />);
    const col = columnasPorNivel();
    const filaCombo = filaDe("SALA 3 PIEZAS");

    expect(filaCombo[col["Anual"].importe]).toHaveTextContent("$10,000"); // × 2
    expect(filaCombo[col["Corto plazo"].importe]).toHaveTextContent("$9,000");
    expect(filaCombo[col["Contado"].importe]).toHaveTextContent("$8,000");

    const filaPieza = screen.getByText("SOFA").closest("tr") as HTMLElement;
    expect(filaPieza.textContent).not.toContain("$");
  });
});

// Todo este arreglo existe para que el capturista COMPARE números. Pero la
// pantalla enseña dos totales calculados por caminos distintos: esta tabla los
// recalcula en el cliente a partir de las líneas, y el encabezado
// (VentaDetalleHero) pinta los que manda el servidor en `venta.montos`. Si
// divergieran, el usuario vería dos totales distintos de la misma venta y
// nada lo notaría.
//
// La prueba compara el pie contra `venta.montos` en vez de contra constantes
// escritas a mano, y lo hace COLUMNA POR COLUMNA: cada monto del servidor
// tiene que estar bajo el encabezado de su nivel, no simplemente aparecer en
// algún lugar del renglón.
//
// La distinción no es teórica. La primera versión de estas pruebas preguntaba
// "¿aparece este texto en este <tr>?", que coteja el CONJUNTO y no el MAPEO.
// Con esa forma, intercambiar `contado` y `corto` en `tierValue` —un precio
// pintado bajo el encabezado del otro nivel, justo el defecto que esta
// pantalla existe para hacer visible— dejaba las seis pruebas en verde.

describe("VentaProductosTable — el pie concuerda con los montos del servidor", () => {
  // Una venta con las dos formas de línea a la vez: un combo con cantidad
  // (que suma por su precio) con una pieza dentro (que no suma), y un
  // producto suelto con cantidad. Es la combinación en la que las variantes
  // equivocadas de la regla dan resultados distintos.
  // Los tres niveles llevan valores DISTINTOS, y los seis totales que salen de
  // ellos también. Es deliberado: con dos niveles iguales —como en la venta
  // real de las 8 sillas, donde contado y corto plazo valían los dos 7,700—
  // intercambiar esas dos columnas es indetectable por construcción, y la
  // prueba no puede decir nada sobre el mapeo.
  const COMBO = { cantidad: 2, anual: 5000, corto: 4500, contado: 4000 };
  const SUELTO = { cantidad: 8, anual: 1400, corto: 1300, contado: 1200 };

  const ventaConCombo = () =>
    makeVenta({
      montos: {
        anual: String(COMBO.cantidad * COMBO.anual + SUELTO.cantidad * SUELTO.anual),
        corto_plazo: String(COMBO.cantidad * COMBO.corto + SUELTO.cantidad * SUELTO.corto),
        contado: String(COMBO.cantidad * COMBO.contado + SUELTO.cantidad * SUELTO.contado),
      },
      combos: [
        {
          id: "44444444-4444-4444-4444-444444444444",
          nombre: "SALA 3 PIEZAS",
          precio_anual: String(COMBO.anual),
          precio_corto: String(COMBO.corto),
          precio_contado: String(COMBO.contado),
          cantidad: String(COMBO.cantidad),
          almacen_origen_id: 1,
          almacen_destino_id: 2,
        },
      ],
      productos: [
        {
          id: "22222222-2222-2222-2222-222222222222",
          articulo_id: 4210,
          articulo: "SILLA MADERA",
          cantidad: String(SUELTO.cantidad),
          precio_anual: String(SUELTO.anual),
          precio_corto: String(SUELTO.corto),
          precio_contado: String(SUELTO.contado),
          combo_id: null,
          almacen_origen_id: 1,
          almacen_destino_id: 2,
        },
        {
          id: "33333333-3333-3333-3333-333333333333",
          articulo_id: 900,
          articulo: "SOFA",
          cantidad: "1",
          precio_anual: "9999",
          precio_corto: "9999",
          precio_contado: "9999",
          combo_id: "44444444-4444-4444-4444-444444444444",
          almacen_origen_id: null,
          almacen_destino_id: null,
        },
      ],
    } as unknown as Partial<VentaV2>);

  const fmt = (raw: string) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(raw));

  it("cada total del pie está bajo su nivel y vale lo que manda el servidor", () => {
    const venta = ventaConCombo();
    render(<VentaProductosTable venta={venta} />);
    const col = columnasPorNivel();
    const pie = filaDe("Total");

    // Es un cotejo del MAPEO, no del conjunto: cada monto del servidor tiene
    // que estar en la columna de su nivel. Así cae tanto una divergencia de
    // cálculo (dejar de contar los combos) como un cruce de columnas (pintar
    // el precio de un nivel bajo el encabezado de otro).
    expect(pie[col["Anual"].importe]).toHaveTextContent(fmt(venta.montos.anual));
    expect(pie[col["Corto plazo"].importe]).toHaveTextContent(
      fmt(venta.montos.corto_plazo),
    );
    expect(pie[col["Contado"].importe]).toHaveTextContent(fmt(venta.montos.contado));
  });

  it("y los unitarios de cada renglón también están bajo su nivel", () => {
    render(<VentaProductosTable venta={ventaConCombo()} />);
    const col = columnasPorNivel();
    const fila = filaDe("SILLA MADERA");

    expect(fila[col["Anual"].unitario]).toHaveTextContent(fmt(String(SUELTO.anual)));
    expect(fila[col["Corto plazo"].unitario]).toHaveTextContent(
      fmt(String(SUELTO.corto)),
    );
    expect(fila[col["Contado"].unitario]).toHaveTextContent(
      fmt(String(SUELTO.contado)),
    );
  });

  it("la pieza del combo no se cuela en el total aunque traiga precio propio", () => {
    // El SOFA lleva 9,999 en los tres niveles y NO debe sumar: su valor ya
    // está dentro del precio del combo.
    const venta = ventaConCombo();
    render(<VentaProductosTable venta={venta} />);
    const col = columnasPorNivel();
    const pie = filaDe("Total");

    expect(pie[col["Anual"].importe]).toHaveTextContent(fmt(venta.montos.anual));
    expect(pie[col["Anual"].importe]).not.toHaveTextContent(
      fmt(String(Number(venta.montos.anual) + 9999)),
    );
  });
});
