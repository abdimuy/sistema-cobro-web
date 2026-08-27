import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MontoInputProps {
  value: string;
  onChange: (next: string) => void;
  error?: boolean;
  placeholder?: string;
  compact?: boolean;
}

/**
 * Campo de monto con búfer de tecleo.
 *
 * Antes era un input totalmente controlado sobre la prop `value`. Eso funciona
 * cuando el padre guarda un string, pero las tablas de edición guardan un
 * número y devuelven `parseFloat(v) || 0` en cada pulsación: al teclear el
 * punto, `parseFloat("1250.")` da 1250, el padre repintaba "1250" y el punto
 * desaparecía. El usuario escribía "1250.50" y quedaba guardado 125050 — cien
 * veces más, sin error y sin aviso.
 *
 * El arreglo es el patrón de CantidadInput: lo tecleado vive en un búfer local
 * y manda mientras el campo tiene el foco. Dos diferencias deliberadas con
 * CantidadInput:
 *
 *  - se sigue emitiendo `onChange` en cada pulsación, porque los usos con
 *    estado string (PlanTab, AgregarComboPanel) dependen de ver el texto en
 *    vivo y de que su validación reaccione mientras se escribe;
 *  - el búfer se re-sincroniza con la prop cuando ésta cambia y el campo NO
 *    tiene el foco (reset del formulario, recálculo del padre, reutilización
 *    de la fila). CantidadInput no hace esto y por eso ignora los cambios
 *    externos; aquí sería un defecto porque el padre puede reescribir el monto.
 */
export const MontoInput = ({
  value,
  onChange,
  error,
  placeholder,
  compact,
}: MontoInputProps) => {
  const [raw, setRaw] = useState<string>(value);
  const [focused, setFocused] = useState(false);

  // La prop cambió por un motivo ajeno al tecleo: se refleja. Mientras el campo
  // tiene el foco no se pisa lo que el usuario está escribiendo.
  useEffect(() => {
    if (!focused && raw !== value) setRaw(value);
    // `raw` queda fuera de las dependencias a propósito: este efecto reacciona
    // a la prop y al foco, no a cada pulsación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused]);

  const handleBlur = () => {
    setFocused(false);

    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) {
      // "", ".", "abc": no hay número que conservar.
      if (raw !== "") {
        setRaw("");
        onChange("");
      }
      return;
    }

    // Único recorte: el punto colgante de "12.". El resto del texto se respeta
    // tal cual — si el padre guarda un número, el efecto de arriba lo devuelve
    // ya normalizado ("1250.50" → "1250.5"); si guarda un string, se conserva
    // lo que el usuario tecleó.
    const cleaned = raw.replace(/\.$/, "");
    if (cleaned !== raw) {
      setRaw(cleaned);
      onChange(cleaned);
    }
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
        $
      </span>
      <Input
        type="text"
        inputMode="decimal"
        className={cn(
          "pl-7 font-mono text-right tabular-nums",
          compact ? "h-7 text-xs" : "h-9 text-sm",
          error && "border-destructive/60 focus-visible:ring-destructive/30",
        )}
        value={raw}
        placeholder={placeholder ?? "0.00"}
        onChange={(e) => {
          setRaw(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        aria-invalid={!!error}
      />
    </div>
  );
};
