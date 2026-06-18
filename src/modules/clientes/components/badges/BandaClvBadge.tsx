import React from "react";
import { formatMoneyShort } from "../lib/format";

interface ColorConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const bandaColors: Record<string, ColorConfig> = {
  ALTO: {
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
  BAJO: {
    bg: "bg-gray-500/10",
    text: "text-gray-500",
    border: "border-gray-500/20",
    dot: "bg-gray-400",
  },
};

const labels: Record<string, string> = {
  ALTO: "CLV alto",
  MEDIO: "CLV medio",
  BAJO: "CLV bajo",
};

interface Props {
  banda?: string;
  clv?: string;
}

const BandaClvBadge: React.FC<Props> = ({ banda, clv }) => {
  if (!banda || !(banda in bandaColors)) return null;

  const colors = bandaColors[banda];
  const label = labels[banda];
  const monto = clv ? formatMoneyShort(clv) : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {monto ? `${label} · ${monto}` : label}
    </span>
  );
};

export default BandaClvBadge;
