import React from "react";
import type { TierValue } from "../../domain/values";

interface ColorConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const tierColors: Record<string, ColorConfig> = {
  A: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  B: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
  },
  C: {
    bg: "bg-gray-500/10",
    text: "text-gray-500",
    border: "border-gray-500/20",
    dot: "bg-gray-400",
  },
  D: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    dot: "bg-muted-foreground/40",
  },
};

const fallback: ColorConfig = {
  bg: "bg-gray-500/10",
  text: "text-gray-400",
  border: "border-gray-500/20",
  dot: "bg-gray-400",
};

function getTierColors(value: string): ColorConfig {
  return tierColors[value] ?? fallback;
}

interface Props {
  value: TierValue | string;
}

const TierBadge: React.FC<Props> = ({ value }) => {
  const colors = getTierColors(value);
  // Tier displays just the letter
  const label = ["A", "B", "C", "D"].includes(value) ? value : value;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
};

export default TierBadge;
