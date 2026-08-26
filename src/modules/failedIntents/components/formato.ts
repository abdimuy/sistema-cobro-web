// Formateadores de la consola. Viven juntos y fuera de los componentes porque
// las tres pantallas —tarjeta, tabla y detalle— tienen que decir la misma
// hora y el mismo monto de la misma manera; dos `toLocaleString` sueltos con
// opciones distintas es cómo una tabla acaba diciendo "13:20" arriba y
// "1:20 p.m." abajo.

const PESOS = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

export function pesos(monto: number | null): string {
  return monto === null ? "—" : PESOS.format(monto);
}

// hour12 en false a propósito: la pantalla es tabular y "13:20" se compara de
// un vistazo con "09:00"; "1:20 p.m." contra "9:00 a.m." no.
const HORA = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const DIA_MES = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

// desdeCuando responde "¿de cuándo viene esto?" con la precisión que
// corresponde: la hora si fue hoy, "ayer" y la hora si fue ayer, el día si es
// más viejo. Una fecha completa para algo de hace dos horas es ruido.
export function desdeCuando(fecha: Date, ahora: Date = new Date()): string {
  const dias = diasDeDiferencia(fecha, ahora);
  if (dias === 0) return `hoy ${HORA.format(fecha)}`;
  if (dias === 1) return `ayer ${HORA.format(fecha)}`;
  return DIA_MES.format(fecha);
}

// haceCuanto es la mitad opuesta: "el último hace 4 minutos". Se queda en
// minutos, horas y días — nadie necesita segundos aquí, y "hace 0 segundos"
// se lee como un error.
export function haceCuanto(fecha: Date, ahora: Date = new Date()): string {
  const minutos = Math.floor((ahora.getTime() - fecha.getTime()) / 60000);
  if (minutos < 1) return "hace menos de un minuto";
  if (minutos < 60) return `hace ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

// diasDeDiferencia cuenta días de CALENDARIO, no de 24 horas: algo de las
// 23:50 de ayer pasó "ayer" a las 00:10 de hoy, aunque hayan corrido veinte
// minutos.
function diasDeDiferencia(fecha: Date, ahora: Date): number {
  const a = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const b = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// ETIQUETAS_MODULO son los nombres bonitos de los módulos que hoy existen.
// Singular: cada renglón es UNA venta o UN pago.
const ETIQUETAS_MODULO: Record<string, string> = {
  ventas: "Venta",
  pagos: "Pago",
  otro: "Otro",
};

// etiquetaModulo es el texto en mayúsculas de la tarjeta y la columna "Módulo".
//
// Acepta cualquier cadena y no una unión cerrada: el módulo lo manda el
// servidor, y el día que el API aprenda a resumir uno nuevo debe aparecer aquí
// SIN tocar el escritorio. Un módulo desconocido se muestra con su propio
// nombre capitalizado —"Garantia"— que es mucho mejor que "Otro" y no exige un
// despliegue del escritorio para leerse bien.
export function etiquetaModulo(modulo: string): string {
  const conocida = ETIQUETAS_MODULO[modulo];
  if (conocida) return conocida;
  const limpio = modulo.trim();
  if (limpio === "") return "Otro";
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}
