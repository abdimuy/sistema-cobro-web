import type { ArticuloAlmacen } from "@/hooks/useGetAlmacenById";

// Precios del catálogo de un artículo, por tipo. `null` = el catálogo no lo
// trae (o no es un número positivo): nunca se rellena con 0 en silencio.
export interface PreciosCatalogo {
  contado: number | null;
  corto: number | null;
  largo: number | null;
}

export type TipoVenta = "CONTADO" | "CREDITO";

export interface PreciosLinea {
  precioAnual: number;
  precioCortoPlazo: number;
  precioContado: number;
}

export type ResultadoPreciosLinea =
  | { ok: true; precios: PreciosLinea }
  | { ok: false; error: string };

type Tipo = keyof PreciosCatalogo;

const TIPO_ORDENADO: Record<string, Tipo> = {
  contado: "contado",
  corto_plazo: "corto",
  largo_plazo: "largo",
};

// La cadena vieja (`PRECIOS`) se clasifica por NOMBRE de la lista, nunca por
// posición: el orden de LIST() en Firebird no está garantizado.
const TIPO_POR_NOMBRE: Record<string, Tipo> = {
  "precio 1 meses": "contado",
  "precio de contado": "contado",
  "precio 4 meses": "corto",
  "precio de lista": "largo",
};

const normalizarNombre = (n: string): string => n.trim().toLowerCase().replace(/\s+/g, " ");

const aPrecio = (texto: string): number | null => {
  const t = texto.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const VACIO = (): PreciosCatalogo => ({ contado: null, corto: null, largo: null });

// Un tipo que aparece dos veces con valores distintos es ambiguo: se trata
// como ausente para que el error lo diga, en lugar de escoger uno al azar.
function asignar(destino: PreciosCatalogo, vistos: Set<Tipo>, tipo: Tipo, precio: number | null) {
  if (vistos.has(tipo)) {
    if (destino[tipo] !== precio) destino[tipo] = null;
    return;
  }
  vistos.add(tipo);
  destino[tipo] = precio;
}

export function leerPreciosCatalogo(
  articulo: Pick<ArticuloAlmacen, "PRECIOS" | "PRECIOS_ORDENADOS">,
): PreciosCatalogo {
  const out = VACIO();
  const vistos = new Set<Tipo>();

  if (Array.isArray(articulo.PRECIOS_ORDENADOS)) {
    for (const p of articulo.PRECIOS_ORDENADOS) {
      const tipo = TIPO_ORDENADO[p.tipo];
      if (tipo) asignar(out, vistos, tipo, aPrecio(String(p.precio)));
    }
    return out;
  }

  for (const entrada of (articulo.PRECIOS ?? "").split(",")) {
    const i = entrada.lastIndexOf(":");
    if (i <= 0) continue;
    const tipo = TIPO_POR_NOMBRE[normalizarNombre(entrada.slice(0, i))];
    if (tipo) asignar(out, vistos, tipo, aPrecio(entrada.slice(i + 1)));
  }
  return out;
}

const ETIQUETA: Record<Tipo, string> = {
  contado: "contado",
  corto: "corto plazo",
  largo: "anual",
};

// Precios de la línea nueva según el tipo de venta.
// - CONTADO: 0 / 0 / contado. Medido en dev (16-oct): escribe a Microsip el
//   mismo dinero que con los tres precios, y mezclar líneas con precios de
//   catálogo y líneas 0/0/C en una venta de contado la rechaza el servidor
//   con `monto_tier_order_invalid`.
// - CRÉDITO: los tres precios del catálogo; ninguno puede faltar, y menos el
//   anual (el servidor exige precio anual en crédito, E-VEN-007).
export function preciosParaLinea(catalogo: PreciosCatalogo, tipoVenta: TipoVenta): ResultadoPreciosLinea {
  if (tipoVenta === "CONTADO") {
    if (catalogo.contado === null) {
      return { ok: false, error: "el producto no tiene precio de contado en el catálogo" };
    }
    return { ok: true, precios: { precioAnual: 0, precioCortoPlazo: 0, precioContado: catalogo.contado } };
  }
  const faltan = (["largo", "corto", "contado"] as const).filter((t) => catalogo[t] === null);
  if (faltan.length > 0 || catalogo.largo === null || catalogo.corto === null || catalogo.contado === null) {
    return {
      ok: false,
      error: `el producto no tiene precio ${faltan.map((t) => ETIQUETA[t]).join(", ")} en el catálogo`,
    };
  }
  return {
    ok: true,
    precios: { precioAnual: catalogo.largo, precioCortoPlazo: catalogo.corto, precioContado: catalogo.contado },
  };
}
