import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  esPausaMinValida,
  PASO_PAUSA_MIN,
  PAUSA_MIN_MAXIMA,
  PAUSA_MIN_MINIMA,
  UMBRALES_PAUSA,
} from "../../presentation/preferencias";

/** Espera tras la última tecla o flecha antes de aplicar (una consulta, no una por tecla). */
export const DEMORA_UMBRAL_MS = 600;

const MENSAJE_INVALIDO = `Escribe un entero entre ${PAUSA_MIN_MINIMA} y ${PAUSA_MIN_MAXIMA} minutos`;

function aEntero(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^\d+$/.test(limpio)) return null;
  const n = Number(limpio);
  return esPausaMinValida(n) ? n : null;
}

function acotar(n: number): number {
  return Math.min(PAUSA_MIN_MAXIMA, Math.max(PAUSA_MIN_MINIMA, n));
}

// ControlUmbralPausa: desde cuántos minutos sin movimientos cuenta una pausa
// (D7, viaja como `pausa_min`). Botones rápidos para lo común y un campo para
// cualquier entero 5–240. Lo inválido se avisa y nunca sale al API; lo tecleado
// se aplica tras una pausa corta, con Enter o al salir del campo.
export function ControlUmbralPausa({
  valor,
  onCambiar,
  className,
}: {
  valor: number;
  onCambiar: (minutos: number) => void;
  className?: string;
}) {
  const [texto, setTexto] = useState(String(valor));
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idEtiqueta = useId();
  const idAviso = useId();

  const cancelar = () => {
    if (temporizador.current !== null) {
      clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  };

  useEffect(() => cancelar, []);

  // Si el valor cambia desde afuera (el tablero o la ficha), el campo lo sigue.
  useEffect(() => {
    setTexto(String(valor));
  }, [valor]);

  const aplicar = (n: number) => {
    cancelar();
    if (n !== valor) onCambiar(n);
  };

  const programar = (nuevo: string) => {
    setTexto(nuevo);
    cancelar();
    const n = aEntero(nuevo);
    if (n === null) return;
    temporizador.current = setTimeout(() => {
      temporizador.current = null;
      if (n !== valor) onCambiar(n);
    }, DEMORA_UMBRAL_MS);
  };

  const confirmar = () => {
    const n = aEntero(texto);
    if (n !== null) aplicar(n);
  };

  const base = aEntero(texto) ?? valor;
  const subir = () => programar(String(acotar(Math.floor(base / PASO_PAUSA_MIN) * PASO_PAUSA_MIN + PASO_PAUSA_MIN)));
  const bajar = () => programar(String(acotar(Math.ceil(base / PASO_PAUSA_MIN) * PASO_PAUSA_MIN - PASO_PAUSA_MIN)));

  const alTeclado = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmar();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      subir();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      bajar();
    }
  };

  const alSalir = () => {
    const n = aEntero(texto);
    if (n === null) {
      cancelar();
      setTexto(String(valor));
    } else {
      aplicar(n);
    }
  };

  const invalido = texto.trim() !== "" && aEntero(texto) === null;

  return (
    <div
      role="group"
      aria-labelledby={idEtiqueta}
      className={cn("relative flex flex-wrap items-center gap-2 text-xs text-muted-foreground", className)}
    >
      <span id={idEtiqueta}>Pausa desde</span>
      <div className="inline-flex rounded-full bg-dsm-tarjeta p-[3px] shadow-sm ring-1 ring-border">
        {UMBRALES_PAUSA.map((m) => {
          const activo = valor === m;
          return (
            <button
              key={m}
              type="button"
              aria-label={`${m} min`}
              aria-pressed={activo}
              onClick={() => {
                setTexto(String(m));
                aplicar(m);
              }}
              className={cn(
                "h-7 min-w-[34px] rounded-full px-2 font-mono text-[12px] transition-colors",
                activo ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m}
            </button>
          );
        })}
      </div>
      <div
        className={cn(
          "inline-flex h-9 items-center rounded-full bg-dsm-tarjeta pl-3 pr-1 ring-1",
          invalido ? "ring-destructive" : "ring-border focus-within:ring-foreground/40",
        )}
      >
        <input
          type="number"
          inputMode="numeric"
          aria-label="Minutos de pausa"
          aria-invalid={invalido}
          aria-describedby={invalido ? idAviso : undefined}
          min={PAUSA_MIN_MINIMA}
          max={PAUSA_MIN_MAXIMA}
          step={PASO_PAUSA_MIN}
          value={texto}
          onChange={(e) => programar(e.target.value)}
          onKeyDown={alTeclado}
          onBlur={alSalir}
          className="w-11 bg-transparent text-right font-mono text-[13px] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="ml-1 text-[12px]">min</span>
        <div className="ml-1 flex flex-col">
          <button
            type="button"
            aria-label="Subir 5 minutos"
            disabled={base >= PAUSA_MIN_MAXIMA}
            onClick={subir}
            className="flex h-3.5 w-5 items-center justify-center rounded-sm hover:text-foreground disabled:opacity-40"
          >
            <ChevronUp aria-hidden className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label="Bajar 5 minutos"
            disabled={base <= PAUSA_MIN_MINIMA}
            onClick={bajar}
            className="flex h-3.5 w-5 items-center justify-center rounded-sm hover:text-foreground disabled:opacity-40"
          >
            <ChevronDown aria-hidden className="h-3 w-3" />
          </button>
        </div>
      </div>
      {invalido && (
        <span id={idAviso} role="alert" className="text-[11px] text-destructive">
          {MENSAJE_INVALIDO}
        </span>
      )}
    </div>
  );
}
