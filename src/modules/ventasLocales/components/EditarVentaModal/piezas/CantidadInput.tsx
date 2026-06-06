import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CantidadInputProps {
  value: number;
  onChange: (next: number) => void;
  error?: boolean;
  placeholder?: string;
}

export const CantidadInput = ({
  value,
  onChange,
  error,
  placeholder,
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
