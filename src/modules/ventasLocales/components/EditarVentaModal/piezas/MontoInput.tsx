import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MontoInputProps {
  value: string;
  onChange: (next: string) => void;
  error?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export const MontoInput = ({
  value,
  onChange,
  error,
  placeholder,
  compact,
}: MontoInputProps) => (
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
      value={value}
      placeholder={placeholder ?? "0.00"}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!error}
    />
  </div>
);
