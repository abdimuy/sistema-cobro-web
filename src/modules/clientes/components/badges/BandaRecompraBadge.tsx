import React from "react";

interface ColorConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const bandaColors: Record<string, ColorConfig> = {
  ALTA: {
    bg: "bg-green-500/10",
    text: "text-green-600",
    border: "border-green-500/20",
    dot: "bg-green-500",
  },
  MEDIA: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  BAJA: {
    bg: "bg-gray-500/10",
    text: "text-gray-500",
    border: "border-gray-500/20",
    dot: "bg-gray-400",
  },
};

const labels: Record<string, string> = {
  ALTA: "Recompra alta",
  MEDIA: "Recompra media",
  BAJA: "Recompra baja",
};

interface Props {
  value?: string;
  score?: number;
}

const BandaRecompraBadge: React.FC<Props> = ({ value }) => {
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

export default BandaRecompraBadge;
