import { useState, useCallback, KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VentasSearchBarProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function VentasSearchBar({
  value,
  onSearch,
  placeholder = "Buscar cliente, teléfono, dirección...",
  className,
}: VentasSearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleSearch = useCallback(() => {
    onSearch(localValue);
  }, [localValue, onSearch]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClear = useCallback(() => {
    setLocalValue("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className={cn("flex gap-2 min-w-0", className)}>
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-9 h-9 bg-background border-border/50 focus-visible:border-border focus-visible:ring-1 focus-visible:ring-ring/20 transition-all"
        />
        {localValue && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <Button
        size="sm"
        onClick={handleSearch}
        className="h-9 px-3"
      >
        Buscar
      </Button>
    </div>
  );
}
