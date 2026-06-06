import React from "react";

interface CampoInlineProps {
  label: string;
  obligatorio?: boolean;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}

export const CampoInline = ({
  label,
  obligatorio,
  helper,
  error,
  children,
}: CampoInlineProps) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {label}
      {!obligatorio && (
        <span className="ml-1.5 normal-case font-normal text-muted-foreground/60">
          · opcional
        </span>
      )}
    </label>
    {children}
    {error ? (
      <p className="text-[11px] text-destructive">{error}</p>
    ) : (
      helper && <p className="text-[11px] text-muted-foreground">{helper}</p>
    )}
  </div>
);
