import React from "react";
import type { EstadoPagoValue } from "../../domain/values";

interface ColorConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const estadoPagoColors: Record<string, ColorConfig> = {
  MOROSO: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500/20",
    dot: "bg-red-500",
  },
  ATRASADO: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  AL_CORRIENTE: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  LIQUIDADO: {
    bg: "bg-green-500/10",
    text: "text-green-500",
    border: "border-green-500/20",
    dot: "bg-green-500",
  },
  SIN_CREDITO: {
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    border: "border-gray-500/20",
    dot: "bg-gray-400",
  },
};

const fallback: ColorConfig = {
  bg: "bg-gray-500/10",
  text: "text-gray-400",
  border: "border-gray-500/20",
  dot: "bg-gray-400",
};

const labels: Record<string, string> = {
  MOROSO: "Moroso",
  ATRASADO: "Atrasado",
  AL_CORRIENTE: "Al corriente",
  LIQUIDADO: "Liquidado",
  SIN_CREDITO: "Sin crédito",
};

function getEstadoPagoColors(value: string): ColorConfig {
  return estadoPagoColors[value] ?? fallback;
}

interface Props {
  value: EstadoPagoValue | string;
}

const EstadoPagoBadge: React.FC<Props> = ({ value }) => {
  const colors = getEstadoPagoColors(value);
  const label = labels[value] ?? value;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
};

export default EstadoPagoBadge;
