import React from "react";
import { getEstadoColors } from "./estadoColors";

interface GarantiaStatusBadgeProps {
  estado: string;
  label?: string;
}

const GarantiaStatusBadge: React.FC<GarantiaStatusBadgeProps> = ({
  estado,
  label,
}) => {
  const colors = getEstadoColors(estado);
  const displayLabel = label || estado.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {displayLabel}
    </span>
  );
};

export default GarantiaStatusBadge;
