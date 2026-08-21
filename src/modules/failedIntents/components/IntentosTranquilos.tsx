import type { IntentoAgrupado } from "../domain/entities";
import { desdeCuando, etiquetaModulo, pesos } from "./formato";

// IntentosTranquilos es la mitad de abajo: lo que se está curando solo.
//
// Es una tabla y no tarjetas a propósito. Estas filas no piden nada; están
// aquí para que quien mira sepa que el sistema las tiene, no para que actúe.
// Sin acento, sin botones, sin badges de estado: el peso visual que tenga es
// peso que le quita a la zona de arriba.
export function IntentosTranquilos({
  intentos,
  onSeleccionar,
  ahora,
}: {
  intentos: ReadonlyArray<IntentoAgrupado>;
  onSeleccionar: (intento: IntentoAgrupado) => void;
  ahora?: Date;
}) {
  if (intentos.length === 0) {
    return (
      <p className="text-[13px] text-zinc-500 px-2.5 py-3" data-testid="tranquilos-vacio">
        Nada reintentándose ahora mismo
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" data-testid="intentos-tranquilos">
        <thead>
          <tr>
            <Th>Quién</Th>
            <Th>Módulo</Th>
            <Th>Qué pasó</Th>
            <Th derecha>Monto</Th>
            <Th derecha>Intentos</Th>
            <Th derecha>Desde</Th>
          </tr>
        </thead>
        <tbody>
          {intentos.map((i) => (
            <tr
              key={i.clave}
              data-testid={`intento-tranquilo-${i.id}`}
              tabIndex={0}
              onClick={() => onSeleccionar(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSeleccionar(i);
                }
              }}
              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#A33A2A] dark:focus-visible:outline-[#E38B76]"
            >
              <Td className="text-zinc-900 dark:text-zinc-100 font-medium">
                {i.quien ?? "Sin nombre capturado"}
              </Td>
              <Td className="text-[10.5px] uppercase tracking-wider text-zinc-500">
                {etiquetaModulo(i.modulo)}
              </Td>
              <Td>{i.titulo}</Td>
              <Td derecha className="tabular-nums text-zinc-900 dark:text-zinc-100">
                {pesos(i.cuanto)}
              </Td>
              <Td derecha className="tabular-nums">
                {i.intentos}
              </Td>
              <Td derecha>{desdeCuando(i.primero, ahora)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, derecha = false }: { children: React.ReactNode; derecha?: boolean }) {
  return (
    <th
      className={[
        "text-[10.5px] uppercase tracking-widest text-zinc-500 font-medium pb-[7px] px-2.5",
        "border-b border-zinc-200 dark:border-zinc-800",
        derecha ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  derecha = false,
  className = "",
}: {
  children: React.ReactNode;
  derecha?: boolean;
  className?: string;
}) {
  return (
    <td
      className={[
        "py-[9px] px-2.5 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400",
        derecha ? "text-right" : "",
        className,
      ].join(" ")}
    >
      {children}
    </td>
  );
}
