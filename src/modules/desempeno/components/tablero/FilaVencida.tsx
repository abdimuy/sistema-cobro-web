import type { UsuarioTablero } from "../../domain/entities";
import type { MovimientoFila } from "../../presentation/hooks/useUltimosMovimientos92Dias";
import { diaDeNegocioDe, fechaCorta, textoInicioSemana, textoInicioSemanaCompacto } from "../lib/format";

const CELDA = "border-y border-border bg-dsm-tarjeta px-2 py-3 align-middle";

// Contrato pulido 2 §4. El texto sale SÓLO del lote de 92 días; el
// `movimientoUltimos7Dias` del tablero (null = nada en 7 días) no se lee aquí.
function textoMovimiento(m: MovimientoFila): string {
  if (m.estado === "cargando") return "Último movimiento: …";
  if (m.estado === "sin_dato") return "Último movimiento: —";
  return m.movimiento
    ? `Último movimiento: ${fechaCorta(diaDeNegocioDe(m.movimiento.hora))}`
    : "Sin movimiento en 92 días";
}

// FilaVencida: semana vencida (D19). El servidor la marca y manda sin cifras;
// aquí sólo se rotula cuándo fue su último movimiento.
export function FilaVencida({
  usuario: u,
  movimiento,
  hoy,
  columnas,
  onAbrir,
}: {
  usuario: UsuarioTablero;
  movimiento: MovimientoFila;
  hoy: string;
  columnas: number;
  onAbrir: (uid: string) => void;
}) {
  return (
    <tr
      tabIndex={0}
      aria-label={`Abrir ficha de ${u.nombre}`}
      onClick={() => onAbrir(u.uid)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
          e.preventDefault();
          onAbrir(u.uid);
        }
      }}
      className="cursor-pointer outline-none [&>td]:transition-colors hover:[&>td]:bg-dsm-marca-fondo focus-visible:[&>td]:bg-dsm-marca-fondo"
    >
      <td className={`${CELDA} max-w-[220px] rounded-l-[14px] border-l pl-[18px]`}>
        <span className="font-serif text-[17px] leading-tight">{u.nombre}</span>
        <div
          className="mt-0.5 truncate whitespace-nowrap font-mono text-[11px] text-muted-foreground"
          title={u.inicioSemana ? textoInicioSemana(u.inicioSemana, hoy) : undefined}
        >
          {u.inicioSemana
            ? `${u.zonaNombre} · ${textoInicioSemanaCompacto(u.inicioSemana, hoy)}`
            : u.zonaNombre}
        </div>
      </td>
      <td
        colSpan={columnas - 1}
        className={`${CELDA} rounded-r-[14px] border-r pr-[18px] text-[13px] text-muted-foreground`}
      >
        {textoMovimiento(movimiento)}
      </td>
    </tr>
  );
}
