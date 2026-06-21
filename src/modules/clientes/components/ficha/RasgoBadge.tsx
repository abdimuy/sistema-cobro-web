import React from "react";

interface ColorConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const aiAccent: ColorConfig = {
  bg: "bg-indigo-500/10",
  text: "text-indigo-600",
  border: "border-indigo-500/25",
  dot: "bg-indigo-500",
};

interface Props {
  label: string;
}

export const RasgoBadge: React.FC<Props> = ({ label }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${aiAccent.bg} ${aiAccent.text} ${aiAccent.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${aiAccent.dot}`} />
      {label}
    </span>
  );
};
