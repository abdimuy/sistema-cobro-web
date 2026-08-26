import type { IntentoAgrupado } from "../domain/entities";
import { desdeCuando, etiquetaModulo, haceCuanto, pesos } from "./formato";
import {
  ACENTO_BOTON,
  ACENTO_BORDE,
  ACENTO_FOCO,
  ACENTO_PILDORA,
  LINEA,
  SUPERFICIE,
  SUPERFICIE_2,
  TEXTO_2,
} from "./paleta";

// IntentoCard es el renglón de arriba: lo que necesita que alguien actúe.
//
// Anatomía, de arriba abajo: quién y de qué tipo · cuánto · la frase que dice
// qué hacer · cuántos intentos, desde cuándo y el último · las acciones. Es la
// del mock, con los tokens de la app.
//
// El acento está RESERVADO a esta zona (ver paleta.ts). Si algún día se usa
// también en la tabla de abajo, deja de significar "aquí hace falta una
// persona" y la pantalla vuelve a ser una lista plana.
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
        "border-l-[3px]",
        ACENTO_BORDE,
        SUPERFICIE,
        LINEA,
        "hover:border-input",
        ACENTO_FOCO,
        seleccionado ? `${SUPERFICIE_2} border-input` : "",
      ].join(" ")}
    >
      <div className="flex items-baseline gap-2.5 flex-wrap min-w-0">
        <Nombre intento={intento} />
        <span className={`text-[11px] uppercase tracking-wider ${TEXTO_2}`}>{modulo}</span>
      </div>

      <div className="text-right font-semibold text-[15px] tabular-nums whitespace-nowrap">
        {pesos(intento.cuanto)}
      </div>

      <p className="col-span-full text-[13.5px] mt-1 max-w-[68ch]">{intento.titulo}</p>

      <div className={`col-span-full flex items-center gap-2 flex-wrap mt-2 text-xs ${TEXTO_2}`}>
        <span
          className={`inline-flex items-center rounded-[10px] px-[7px] py-px text-[11.5px] font-semibold tabular-nums ${ACENTO_PILDORA}`}
        >
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

// Nombre resuelve el degradado del título en un solo lugar.
//
// El orden importa y es el arreglo de esta pantalla: el nombre del cliente
// cuando el servidor lo mandó; si no, la referencia —el id de la venta, el del
// cliente en un pago—, que al menos permite buscarlo; y sólo si no hay ninguno
// de los dos, el hueco declarado.
//
// El hueco se dice, no se disimula. Esta pantalla existe para decidir si una
// venta entró o no, y un nombre inventado ahí es peor que un renglón que
// admite no saber de quién es.
function Nombre({ intento }: { intento: IntentoAgrupado }) {
  if (intento.quien) {
    return <span className="font-semibold text-[15px] tracking-tight">{intento.quien}</span>;
  }
  if (intento.referencia) {
    return (
      <span
        className="font-semibold text-[15px] tracking-tight font-mono"
        data-testid={`intento-referencia-${intento.id}`}
      >
        {intento.referencia}
      </span>
    );
  }
  return (
    <span
      className={`font-semibold text-[15px] tracking-tight ${TEXTO_2}`}
      data-testid={`intento-sin-nombre-${intento.id}`}
    >
      Sin nombre capturado
    </span>
  );
}

// etiquetaPrimaria nombra la acción por lo que la persona acaba de hacer, no
// por lo que hace el sistema. Las dos abren el mismo diálogo y disparan el
// mismo reenvío: quien repuso el inventario no está "reenviando un intento",
// está diciendo que ya lo repuso.
function etiquetaPrimaria(intento: IntentoAgrupado): string {
  return intento.causa.value === "falta_inventario" ? "Ya hice el traspaso" : "Reenviar";
}

// Punto es el separador entre los metadatos de la tarjeta.
//
// Va con `muted-foreground/40` y no con `border`: en tema oscuro el token de
// borde es casi el mismo valor que la superficie de la tarjeta, así que los
// puntos desaparecían y los tres datos se leían como una sola frase corrida.
// Se vio al correr la pantalla en oscuro.
function Punto() {
  return (
    <span aria-hidden="true" className="w-[3px] h-[3px] rounded-full bg-muted-foreground/40" />
  );
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
        ACENTO_FOCO,
        primaria
          ? `${ACENTO_BOTON} font-semibold`
          : `${SUPERFICIE} border-input hover:bg-accent hover:text-accent-foreground`,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
