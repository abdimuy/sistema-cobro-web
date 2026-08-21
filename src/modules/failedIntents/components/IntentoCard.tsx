import type { IntentoAgrupado } from "../domain/entities";
import { desdeCuando, etiquetaModulo, haceCuanto, pesos } from "./formato";

// IntentoCard es el renglón de arriba: lo que necesita que alguien actúe.
//
// Anatomía, de arriba abajo: quién y de qué tipo · cuánto · la frase que dice
// qué hacer · cuántos intentos, desde cuándo y el último · las acciones.
//
// El acento ladrillo (#A33A2A claro / #E38B76 oscuro) está reservado a esta
// zona. Si algún día se usa también en la tabla de abajo, deja de significar
// "aquí hace falta una persona" y la pantalla vuelve a ser una lista plana.
export type AccionCard = "reenviar" | "abrir" | "ignorar";

export function IntentoCard({
  intento,
  seleccionado,
  onSeleccionar,
  onAccion,
  ahora,
}: {
  intento: IntentoAgrupado;
  seleccionado: boolean;
  onSeleccionar: (intento: IntentoAgrupado) => void;
  onAccion: (accion: AccionCard, intento: IntentoAgrupado) => void;
  ahora?: Date;
}) {
  const modulo = etiquetaModulo(intento.modulo);

  return (
    <article
      data-testid={`intento-card-${intento.id}`}
      data-selected={seleccionado ? "true" : "false"}
      aria-selected={seleccionado}
      tabIndex={0}
      role="button"
      onClick={() => onSeleccionar(intento)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSeleccionar(intento);
        }
      }}
      className={[
        "grid grid-cols-[minmax(0,1fr)_auto] gap-x-[18px] gap-y-1 rounded-sm border p-[14px_16px] cursor-pointer",
        "border-l-[3px] border-l-[#A33A2A] dark:border-l-[#E38B76]",
        "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
        "hover:border-zinc-300 dark:hover:border-zinc-700",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A33A2A] dark:focus-visible:outline-[#E38B76]",
        seleccionado ? "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700" : "",
      ].join(" ")}
    >
      <div className="flex items-baseline gap-2.5 flex-wrap min-w-0">
        <span className="font-semibold text-[15px] tracking-tight">
          {intento.quien ?? `Sin nombre capturado`}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">{modulo}</span>
      </div>

      <div className="text-right font-semibold text-[15px] tabular-nums whitespace-nowrap">
        {pesos(intento.cuanto)}
      </div>

      <p className="col-span-full text-[13.5px] mt-1 max-w-[68ch]">{intento.titulo}</p>

      <div className="col-span-full flex items-center gap-2 flex-wrap mt-2 text-xs text-zinc-500">
        <span className="inline-flex items-center rounded-[10px] px-[7px] py-px text-[11.5px] font-semibold tabular-nums bg-[#F7E7E2] text-[#A33A2A] dark:bg-[#2E1B16] dark:text-[#E38B76]">
          {intento.intentos} {intento.intentos === 1 ? "intento" : "intentos"}
        </span>
        <Punto />
        <span>desde {desdeCuando(intento.primero, ahora)}</span>
        <Punto />
        <span>el último {haceCuanto(intento.ultimo, ahora)}</span>
      </div>

      <div className="col-span-full flex gap-2 mt-2.5">
        <Boton
          primaria
          testid={`intento-reenviar-${intento.id}`}
          onClick={() => onAccion("reenviar", intento)}
        >
          {etiquetaPrimaria(intento)}
        </Boton>
        <Boton testid={`intento-abrir-${intento.id}`} onClick={() => onAccion("abrir", intento)}>
          Ver {intento.modulo === "pagos" ? "el pago" : "la venta"}
        </Boton>
        <Boton testid={`intento-ignorar-${intento.id}`} onClick={() => onAccion("ignorar", intento)}>
          Ignorar
        </Boton>
      </div>
    </article>
  );
}

// etiquetaPrimaria nombra la acción por lo que la persona acaba de hacer, no
// por lo que hace el sistema. Las dos abren el mismo diálogo y disparan el
// mismo reenvío: quien repuso el inventario no está "reenviando un intento",
// está diciendo que ya lo repuso.
function etiquetaPrimaria(intento: IntentoAgrupado): string {
  return intento.causa.value === "falta_inventario" ? "Ya hice el traspaso" : "Reenviar";
}

function Punto() {
  return <span aria-hidden="true" className="w-[3px] h-[3px] rounded-full bg-zinc-300 dark:bg-zinc-600" />;
}

function Boton({
  children,
  onClick,
  primaria = false,
  testid,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primaria?: boolean;
  testid: string;
}) {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={(e) => {
        // La tarjeta entera abre el detalle; un botón dentro no debe
        // dispararlo también.
        e.stopPropagation();
        onClick();
      }}
      className={[
        "text-[12.5px] px-[11px] py-[5px] rounded-sm border cursor-pointer",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A33A2A] dark:focus-visible:outline-[#E38B76]",
        primaria
          ? "bg-[#A33A2A] border-[#A33A2A] text-white font-semibold dark:bg-[#E38B76] dark:border-[#E38B76] dark:text-[#2A100A]"
          : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
