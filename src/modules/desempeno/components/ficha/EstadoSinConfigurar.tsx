import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { RUTA_CONFIGURAR_USUARIO } from "./sinConfigurar";

// Estado de una pestaña cuando el API responde 409 sin zona / sin inicio de
// semana: el mensaje del servidor y el camino para configurarlo.
export function EstadoSinConfigurar({ mensaje }: { mensaje: string }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-[14px] bg-dsm-tarjeta px-6 py-12 text-center ring-1 ring-border"
    >
      <p className="font-serif text-xl">Sin configurar</p>
      <p className="max-w-sm text-sm text-muted-foreground">{mensaje}</p>
      <Link
        to={RUTA_CONFIGURAR_USUARIO}
        className="inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] ring-1 ring-border hover:bg-muted"
      >
        <Settings aria-hidden className="h-3.5 w-3.5" />
        Configurar en Usuarios
      </Link>
    </div>
  );
}
