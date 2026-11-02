import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

type Estilos = google.maps.MapTypeStyle[];

// Fuera los puntos de interés (comercios, escuelas, etc.) y el tránsito: no
// aportan al cobro y ensucian el mapa. Se conservan calles, sus nombres,
// colonias/localidades y agua.
const OCULTAR_RUIDO: Estilos = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

export const ESTILOS_CLAROS: Estilos = [...OCULTAR_RUIDO];

// Tonos neutros alineados con --background del tema oscuro (0 0% 3.9%): un
// poco más claros que el fondo de la app para que el mapa se distinga de la
// tarjeta que lo contiene.
export const ESTILOS_OSCUROS: Estilos = [
  { elementType: "geometry", stylers: [{ color: "#171717" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#999999" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#171717" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#555555" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#b0b0b0" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#3a3a3a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#262626" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#aaaaaa" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#4d4d4d" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#333333" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0f1a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6b8cae" }] },
  ...OCULTAR_RUIDO,
];

const CONSULTA_OSCURO = "(prefers-color-scheme: dark)";

function sistemaEsOscuro(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(CONSULTA_OSCURO).matches;
}

/** Estilos del mapa según el tema de la app; reacciona al cambio de tema y,
 *  con tema "system", al cambio de prefers-color-scheme. */
export function useEstilosDeMapa(): Estilos {
  const { theme } = useTheme();
  const [sistemaOscuro, setSistemaOscuro] = useState(sistemaEsOscuro);

  useEffect(() => {
    if (theme !== "system" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(CONSULTA_OSCURO);
    const alCambiar = () => setSistemaOscuro(mq.matches);
    alCambiar();
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, [theme]);

  const oscuro = theme === "dark" || (theme === "system" && sistemaOscuro);
  return oscuro ? ESTILOS_OSCUROS : ESTILOS_CLAROS;
}
