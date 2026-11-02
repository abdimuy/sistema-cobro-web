import { useEffect, useRef, useState } from "react";
import { GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api";
import { MapaConCarga } from "@/components/maps/MapaConCarga";
import { useEstilosDeMapa } from "@/components/maps/estilosDeMapa";
import { UMBRAL_FUSION_M, distanciaMetros } from "./distancia";
import { VARIABLE_COLOR, type CategoriaPunto } from "./categoriaPunto";

export type PuntoMapa = {
  id: string;
  n: number;
  lat: number;
  lng: number;
  categoria: CategoriaPunto;
  /** Hora ya formateada (HH:mm) para el tooltip y las etiquetas. */
  hora: string;
  /** Minutos desde medianoche de `hora` (para el filtro de horario). */
  minutos: number;
  tipo: string;
  cliente: string;
};

const CIRCULO = 0; // google.maps.SymbolPath.CIRCLE

// Lee un token HSL del tema ("150 66% 27%") y lo da como color CSS para Maps.
function colorDeToken(variable: string): string {
  const crudo = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  const [h, s, l] = crudo.split("/")[0].trim().split(/\s+/);
  return h && s && l ? `hsl(${h}, ${s}, ${l})` : "#6b7280";
}

function leerColores(): Record<keyof typeof VARIABLE_COLOR | "texto", string> {
  const base = Object.fromEntries(
    Object.entries(VARIABLE_COLOR).map(([k, v]) => [k, colorDeToken(v)]),
  ) as Record<keyof typeof VARIABLE_COLOR, string>;
  return { ...base, texto: colorDeToken("--foreground") };
}

// Cargado en diferido desde MapaJornada. El script de Maps lo pide
// MapaConCarga, con la misma llave y cargador que el resto de los mapas.
// Los puntos llegan en el orden de la lista del servidor; aquí sólo se pintan.
export function MapaJornadaGoogle({
  puntos,
  onSeleccionar,
  enfocada = null,
  onEnfocar,
  trayecto = false,
  rango = null,
  finEsCierre = true,
  claveDia = "",
  alto = "300px",
}: {
  puntos: readonly PuntoMapa[];
  onSeleccionar: (id: string) => void;
  enfocada?: string | null;
  onEnfocar?: (id: string | null) => void;
  /** Muestra la polilínea entre puntos (apagada por omisión). */
  trayecto?: boolean;
  /** Filtro de horario [desde, hasta] en minutos; sólo decide qué se pinta. */
  rango?: readonly [number, number] | null;
  /** false: el día sigue en curso y el último marcador dice "Última". */
  finEsCierre?: boolean;
  /** Cambia con el día: es lo único que re-encuadra el mapa. */
  claveDia?: string;
  alto?: string;
}) {
  const estilos = useEstilosDeMapa();
  const mapaRef = useRef<google.maps.Map | null>(null);
  const [colores, setColores] = useState(leerColores);

  // El tema cambia la clase `dark` en un efecto del proveedor, que corre
  // después del de los hijos: se relee en el siguiente turno.
  useEffect(() => {
    const t = setTimeout(() => setColores(leerColores()), 0);
    return () => clearTimeout(t);
  }, [estilos]);

  // Encuadre: sólo al cargar o cambiar de día, nunca al mover el filtro.
  const puntosRef = useRef(puntos);
  puntosRef.current = puntos;
  const ajustar = (mapa: google.maps.Map) => {
    const limites = new google.maps.LatLngBounds();
    puntosRef.current.forEach((p) => limites.extend({ lat: p.lat, lng: p.lng }));
    if (puntosRef.current.length > 0) mapa.fitBounds(limites, 48);
  };
  useEffect(() => {
    if (mapaRef.current) ajustar(mapaRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveDia]);

  const enRango = (p: PuntoMapa) => rango === null || (p.minutos >= rango[0] && p.minutos <= rango[1]);
  const visibles = puntos.filter(enRango);

  const inicio = puntos[0];
  const fin = puntos.length > 1 ? puntos[puntos.length - 1] : undefined;
  const palabraFin = finEsCierre ? "Fin" : "Última";
  const fusionados = fin !== undefined && distanciaMetros(inicio, fin) < UMBRAL_FUSION_M;
  // Marcadores de extremo: uno solo si están cerca; si no, uno arriba y otro abajo.
  const extremos: Array<{ p: PuntoMapa; texto: string; abajo: boolean; clave: string; visible: boolean }> = [];
  if (inicio) {
    if (fin && fusionados) {
      extremos.push({
        p: inicio,
        texto: `Inicio ${inicio.hora} · ${palabraFin} ${fin.hora}`,
        abajo: false,
        clave: "extremo-fusion",
        visible: enRango(inicio) || enRango(fin),
      });
    } else {
      extremos.push({ p: inicio, texto: `Inicio ${inicio.hora}`, abajo: false, clave: "extremo-inicio", visible: enRango(inicio) });
      if (fin) {
        extremos.push({ p: fin, texto: `${palabraFin} ${fin.hora}`, abajo: true, clave: "extremo-fin", visible: enRango(fin) });
      }
    }
  }
  const origen = (abajo: boolean) =>
    typeof google !== "undefined" && google.maps?.Point
      ? new google.maps.Point(0, abajo ? 2.8 : -2.6)
      : undefined;

  return (
    <MapaConCarga alto={alto}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: alto }}
        onLoad={(mapa) => {
          mapaRef.current = mapa;
          ajustar(mapa);
        }}
        onUnmount={() => {
          mapaRef.current = null;
        }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          styles: estilos,
        }}
      >
        {trayecto &&
          visibles.slice(1).map((p, i) => (
          <PolylineF
            key={`seg-${visibles[i].id}-${p.id}`}
            path={[
              { lat: visibles[i].lat, lng: visibles[i].lng },
              { lat: p.lat, lng: p.lng },
            ]}
            options={{
              strokeColor: colores.marca,
              // De claro a oscuro conforme avanza el día.
              strokeOpacity: 0.2 + (0.7 * (i + 1)) / Math.max(visibles.length - 1, 1),
              strokeWeight: 2,
              clickable: false,
            }}
          />
        ))}
        {visibles.map((p) => {
          const activo = enfocada === p.id;
          return (
            <MarkerF
              key={p.id}
              position={{ lat: p.lat, lng: p.lng }}
              title={`${p.n} · ${p.hora} · ${p.tipo} · ${p.cliente}`}
              zIndex={activo ? 1000 : p.n}
              icon={{
                path: CIRCULO,
                scale: activo ? 9 : 5,
                fillColor: colores[p.categoria],
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
              onClick={() => onSeleccionar(p.id)}
              onMouseOver={() => onEnfocar?.(p.id)}
              onMouseOut={() => onEnfocar?.(null)}
            />
          );
        })}
        {extremos
          .filter((e) => e.visible)
          .map(({ p, texto, abajo, clave }) => (
            <MarkerF
              key={clave}
              position={{ lat: p.lat, lng: p.lng }}
              zIndex={900}
              icon={{
                path: CIRCULO,
                scale: 9,
                fillColor: colores.marca,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
                labelOrigin: origen(abajo),
              }}
              label={{
                text: texto,
                fontSize: "12px",
                fontWeight: "600",
                color: colores.texto,
              }}
              onClick={() => onSeleccionar(p.id)}
            />
          ))}
      </GoogleMap>
    </MapaConCarga>
  );
}
