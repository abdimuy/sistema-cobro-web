import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CantidadInputProps {
  value: number;
  onChange: (next: number) => void;
  error?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export const CantidadInput = ({
  value,
  onChange,
  error,
  placeholder,
  compact,
}: CantidadInputProps) => {
  const [raw, setRaw] = useState<string>(String(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRaw(e.target.value);
  };

  const handleBlur = () => {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
      setRaw(String(parsed));
    } else {
      setRaw(String(value));
    }
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      className={cn(
        "font-mono tabular-nums",
        compact ? "h-7 text-xs" : "h-9 text-sm",
        error && "border-destructive/60 focus-visible:ring-destructive/30",
      )}
      value={raw}
      placeholder={placeholder ?? "1"}
      onChange={handleChange}
      onBlur={handleBlur}
      aria-invalid={!!error}
    />
  );
};
