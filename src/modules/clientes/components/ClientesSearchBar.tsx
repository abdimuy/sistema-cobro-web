import { useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// ClientesSearchBar fires onSearch only on Enter key or search button click —
// NOT on every keystroke. The parent sets committed search state directly.
export function ClientesSearchBar({
  value,
  onSearch,
  placeholder = "Buscar cliente, teléfono, zona...",
  className,
}: Props) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      onSearch(localValue.trim());
    }
    if (e.key === "Escape") {
      setLocalValue("");
      onSearch("");
      inputRef.current?.blur();
    }
  }

  function handleClear() {
    setLocalValue("");
    onSearch("");
    inputRef.current?.focus();
  }

  function handleSearchClick() {
    onSearch(localValue.trim());
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-8 pr-16 h-8 text-xs border-border/60"
        aria-label="Buscar clientes"
      />
      <div className="absolute right-1 flex items-center gap-0.5">
        {localValue && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
            tabIndex={-1}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleSearchClick}
          aria-label="Buscar"
          tabIndex={-1}
        >
          <Search className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
