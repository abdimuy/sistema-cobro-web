import { Link } from "react-router-dom";
import type { UsuarioTablero } from "../../domain/entities";

const MENSAJE = {
  sin_zona: "No tiene zona asignada. Sin zona no se puede medir su jornada ni sus cuentas.",
  sin_inicio_semana: "No tiene inicio de semana. Sin él no se puede medir su jornada ni sus cuentas.",
} as const;

// Usuario sin zona o sin inicio de semana (spec §5, contrato v2 §2). El enlace
// va a Usuarios (/settings), donde se editan la zona y el inicio de semana
// (src/components/settings/UserCard.tsx).
export function FilaSinConfigurar({
  usuario: u,
  puedeConfigurar,
  columnas,
}: {
  usuario: UsuarioTablero;
  puedeConfigurar: boolean;
  columnas: number;
}) {
  const motivo = u.motivoNoConfigurado ?? "sin_zona";
  return (
    <tr>
      <td className="rounded-l-[14px] border-y border-l border-dashed border-border px-2 py-3.5 pl-[18px]">
        <div className="font-serif text-[17px] leading-tight text-muted-foreground">{u.nombre}</div>
        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{u.zonaNombre ?? u.email}</div>
      </td>
      <td className="border-y border-dashed border-border px-2 py-3.5">
        <span className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
          <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-muted-foreground/50" />
          Sin configurar
        </span>
      </td>
      <td
        colSpan={columnas - 3}
        className="border-y border-dashed border-border px-2 py-3.5 text-[12.5px] text-muted-foreground"
      >
        {MENSAJE[motivo]}
      </td>
      <td className="rounded-r-[14px] border-y border-r border-dashed border-border px-2 py-3.5 pr-[18px] text-right">
        {puedeConfigurar ? (
          <Link
            to="/settings"
            className="inline-flex h-9 items-center rounded-full bg-dsm-tarjeta px-4 text-[13px] ring-1 ring-border hover:bg-muted"
          >
            Configurar
          </Link>
        ) : (
          <span className="text-[12px] text-muted-foreground">Pide a un administrador</span>
        )}
      </td>
    </tr>
  );
}
