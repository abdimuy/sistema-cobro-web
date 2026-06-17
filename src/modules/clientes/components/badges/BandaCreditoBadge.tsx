import React from "react";

interface ColorConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const bandaColors: Record<string, ColorConfig> = {
  BAJO: {
    bg: "bg-green-500/10",
    text: "text-green-600",
    border: "border-green-500/20",
    dot: "bg-green-500",
  },
  MEDIO: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  ALTO: {
    bg: "bg-orange-500/10",
    text: "text-orange-500",
    border: "border-orange-500/20",
    dot: "bg-orange-500",
  },
  CRITICO: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500/20",
    dot: "bg-red-500",
  },
};

const labels: Record<string, string> = {
  BAJO: "Riesgo bajo",
  MEDIO: "Riesgo medio",
  ALTO: "Riesgo alto",
  CRITICO: "Riesgo crítico",
};

interface Props {
  value?: string;
}

const BandaCreditoBadge: React.FC<Props> = ({ value }) => {
  if (!value || !(value in bandaColors)) return null;

  const colors = bandaColors[value];
  const label = labels[value];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
};

export default BandaCreditoBadge;
