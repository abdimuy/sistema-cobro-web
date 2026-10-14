import type { FiltrosActividad } from "../../domain/entities";
import type { ConsultaCuentas, ConsultaJornada } from "../../application/ports/DesempenoPort";

export type Params = Record<string, string | number | string[]>;

// Contrato §0: pausa_min siempre; desde_hora/hasta_hora ambos o ninguno.
export function paramsDeJornada(c: ConsultaJornada): Params {
  const p: Params = { pausa_min: c.pausaMin };
  if (c.horario) {
    p.desde_hora = c.horario.desde;
    p.hasta_hora = c.horario.hasta;
  }
  return p;
}

// Contrato §4. Arreglos vacíos y nulos no se mandan; los arreglos se repiten
// sin corchetes (tipo=pago&tipo=visita) con paramsSerializer { indexes: null }.
// `forma_cobro` lleva códigos (no ids) y `tipo_visita` literales exactos.
export function paramsDeActividad(f: FiltrosActividad): Params {
  const p: Params = { orden: f.orden, dir: f.dir };
  if (f.desde) p.desde = f.desde;
  if (f.hasta) p.hasta = f.hasta;
  if (f.tipos.length) p.tipo = [...f.tipos];
  if (f.formasCobro.length) p.forma_cobro = [...f.formasCobro];
  if (f.tiposVisita.length) p.tipo_visita = [...f.tiposVisita];
  if (f.registradoPor.length) p.registrado_por = [...f.registradoPor];
  if (f.montoMin !== null) p.monto_min = f.montoMin;
  if (f.montoMax !== null) p.monto_max = f.montoMax;
  if (f.conFotos !== null) p.con_fotos = String(f.conFotos);
  if (f.conGps !== null) p.con_gps = String(f.conGps);
  if (f.q.trim() !== "") p.q = f.q.trim();
  return p;
}

// Contrato §5.
export function paramsDeCuentas(c: ConsultaCuentas): Params {
  const p: Params = { orden: c.orden, dir: c.dir };
  if (c.segmento) p.segmento = c.segmento;
  if (c.q.trim() !== "") p.q = c.q.trim();
  return p;
}
