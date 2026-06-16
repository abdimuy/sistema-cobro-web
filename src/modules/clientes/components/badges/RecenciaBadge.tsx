import React from "react";

function getLabel(dias: number): string {
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  return `${dias} d`;
}

function getClassName(dias: number): string {
  if (dias <= 1) return "text-emerald-600 font-medium";
  if (dias <= 6) return "text-emerald-600";
  if (dias <= 29) return "text-foreground/70";
  if (dias <= 89) return "text-foreground/60";
  if (dias <= 179) return "text-amber-600";
  return "text-red-500";
}

interface Props {
  dias: number;
  tienePulso?: boolean;
}

const RecenciaBadge: React.FC<Props> = ({ dias, tienePulso = true }) => {
  if (!tienePulso || dias == null) {
    return (
      <span className="tabular-nums text-xs text-muted-foreground">—</span>
    );
  }

  return (
    <span className={`tabular-nums text-xs ${getClassName(dias)}`}>
      {getLabel(dias)}
    </span>
  );
};

export default RecenciaBadge;
