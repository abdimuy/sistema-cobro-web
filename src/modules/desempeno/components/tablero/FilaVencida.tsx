import type { UsuarioTablero } from "../../domain/entities";
import { diaDeNegocioDe, fechaCorta, textoInicioSemana } from "../lib/format";

const CELDA = "border-y border-border bg-dsm-tarjeta px-2 py-3 align-middle";

// FilaVencida: semana vencida (D19). El servidor la marca y manda sin cifras;
// aquí sólo se rotula cuándo fue su último movimiento.
export function FilaVencida({
  usuario: u,
  hoy,
  columnas,
  onAbrir,
}: {
  usuario: UsuarioTablero;
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
        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{u.zonaNombre}</div>
        {u.inicioSemana && (
          <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {textoInicioSemana(u.inicioSemana, hoy)}
          </div>
        )}
      </td>
      <td
        colSpan={columnas - 1}
        className={`${CELDA} rounded-r-[14px] border-r pr-[18px] text-[13px] text-muted-foreground`}
      >
        {u.ultimoMovimiento
          ? `Último movimiento: ${fechaCorta(diaDeNegocioDe(u.ultimoMovimiento.hora))}`
          : "Sin movimiento en 92 días"}
      </td>
    </tr>
  );
}
