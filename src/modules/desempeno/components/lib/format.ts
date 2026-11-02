import { enRelojDeNegocio } from "@/utils/tiempoDeNegocio";

// Formato de presentación. Ninguna función calcula cifras del negocio: solo
// convierte lo que llegó del API a texto (D10). Las horas SIEMPRE se leen en
// la zona del negocio (tiempoDeNegocio), nunca en la del navegador.

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-10-14T16:31:00Z" → "10:31" (reloj de la oficina). */
export function horaCorta(iso: string): string {
  return enRelojDeNegocio(iso).slice(11, 16);
}

/** Día de calendario del negocio de un instante: "2026-10-14". */
export function diaDeNegocioDe(iso: string): string {
  return enRelojDeNegocio(iso).slice(0, 10);
}

/** Importe de una condonación sin signo: se distingue por color/etiqueta, no por "−". Sólo formato. */
export function dineroSinSigno(importe: string): string {
  return dinero2(importe.replace(/^-/, ""));
}

export function hoyDeNegocio(ahora: Date = new Date()): string {
  return diaDeNegocioDe(ahora.toISOString());
}

function aFecha(dia: string): Date {
  const [anio, mes, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, d));
}

/** "2026-10-14" → "miércoles 14 de octubre". */
export function fechaLarga(dia: string): string {
  const f = aFecha(dia);
  return `${DIAS[f.getUTCDay()]} ${f.getUTCDate()} de ${MESES[f.getUTCMonth()]}`;
}

/** "2026-10-09" → "vie 9 oct". */
export function fechaCorta(dia: string): string {
  const f = aFecha(dia);
  return `${DIAS_CORTOS[f.getUTCDay()]} ${f.getUTCDate()} ${MESES_CORTOS[f.getUTCMonth()]}`;
}

/** "2026-10-20" → "20 oct" (día civil tal cual, sin zona). */
export function diaMes(dia: string): string {
  const f = aFecha(dia);
  return `${f.getUTCDate()} ${MESES_CORTOS[f.getUTCMonth()]}`;
}

/** Avanza sobre el calendario, no sumando 24 h a un instante. */
export function sumarDias(dia: string, n: number): string {
  const f = aFecha(dia);
  f.setUTCDate(f.getUTCDate() + n);
  return f.toISOString().slice(0, 10);
}

/** Días de calendario de `desde` a `hasta`, ambos incluidos. */
export function diasEntre(desde: string, hasta: string): string[] {
  const dias: string[] = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) dias.push(d);
  return dias;
}

/** 72 → "1 h 12 min"; 45 → "45 min"; 120 → "2 h". */
export function duracion(min: number): string {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

/** 65 → "1 h 05"; 30 → "30 min" (celdas angostas). */
export function duracionCorta(min: number): string {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h === 0 ? `${r} min` : `${h} h ${String(r).padStart(2, "0")}`;
}

const MXN_SIN_CENTAVOS = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const MXN = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "8600.00" → "$8,600". Si no es número, se muestra tal cual. */
export function dinero(raw: string): string {
  const n = Number(raw);
  return Number.isFinite(n) ? MXN_SIN_CENTAVOS.format(n) : raw;
}

/** "150.00" → "$150.00". */
export function dinero2(raw: string): string {
  const n = Number(raw);
  return Number.isFinite(n) ? MXN.format(n) : raw;
}

/**
 * Centavos enteros del API → "$150" o "$150.05". Pesos y centavos se separan
 * con aritmética entera: el monto nunca pasa por un flotante con fracción.
 */
export function pesosDeCentavos(centavos: number): string {
  const pesos = Math.trunc(centavos / 100);
  const resto = Math.abs(centavos % 100);
  const base = MXN_SIN_CENTAVOS.format(pesos);
  return resto === 0 ? base : `${base}.${String(resto).padStart(2, "0")}`;
}

/** "65.90" → "65.9%"; null → "—". */
export function porcentaje(raw: string | null): string {
  if (raw === null) return "—";
  const n = Number(raw);
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : raw;
}

export function entero(n: number): string {
  return n.toLocaleString("es-MX");
}

export function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}

export function sinAcentos(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** "Juan Carlos Méndez" → "Juan Carlos". */
export function primerNombre(nombre: string): string {
  return nombre.split(" ").slice(0, 2).join(" ");
}

/**
 * Rótulo del inicio de semana con fecha y hora de la oficina:
 * ("2026-10-15T14:12:00Z", "2026-10-15") → "Semana desde jue 15 oct, 08:12 · hoy".
 * `hace N d` son días de calendario del negocio entre el inicio y `hoy`
 * (rotulación, no una cifra del negocio). Si el inicio es del mismo día de
 * negocio que `hoy` termina en "· hoy"; si cae después, se omite el "hace".
 * `hoy` es el del servidor (`ficha.hoy`, `tablero.hoy`), nunca el de la Mac.
 */
export function textoInicioSemana(inicioIso: string, hoy: string): string {
  return `Semana ${sufijoInicioSemana(inicioIso, hoy, true)}`;
}

/**
 * Versión compacta para las filas del tablero (sin hora, cabe junto a la zona):
 * → "desde jue 15 oct · hace 3 d". La hora exacta va en el tooltip con
 * `textoInicioSemana`.
 */
export function textoInicioSemanaCompacto(inicioIso: string, hoy: string): string {
  return sufijoInicioSemana(inicioIso, hoy, false);
}

function sufijoInicioSemana(inicioIso: string, hoy: string, conHora: boolean): string {
  const dia = diaDeNegocioDe(inicioIso);
  const base = `desde ${fechaCorta(dia)}${conHora ? `, ${horaCorta(inicioIso)}` : ""}`;
  if (dia > hoy) return base;
  if (dia === hoy) return `${base} · hoy`;
  return `${base} · hace ${diasEntre(dia, hoy).length - 1} d`;
}
