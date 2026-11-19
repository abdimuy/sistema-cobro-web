export interface PaletaModo {
  card: string;
  exacta: { bg: string; fg: string };
  aprox: { fg: string; linea: string };
  chip: { borde: string; fg: string };
}

export const PALETA_COINCIDENCIA: { claro: PaletaModo; oscuro: PaletaModo } = {
  claro: {
    card: "#ffffff",
    exacta: { bg: "#dbeafe", fg: "#1e3a8a" },
    aprox: { fg: "#1e40af", linea: "#2563eb" },
    chip: { borde: "#93c5fd", fg: "#1e40af" },
  },
  oscuro: {
    card: "#0a0a0a",
    exacta: { bg: "#1e3a8a", fg: "#dbeafe" },
    aprox: { fg: "#93c5fd", linea: "#60a5fa" },
    chip: { borde: "#3b82f6", fg: "#93c5fd" },
  },
};

function luminancia(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const canal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}

export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
