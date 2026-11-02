import { useEffect, useRef, useState } from "react";
import { GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api";
import { MapaConCarga } from "@/components/maps/MapaConCarga";
import { useEstilosDeMapa } from "@/components/maps/estilosDeMapa";
import { VARIABLE_COLOR, type CategoriaPunto } from "./categoriaPunto";

export type PuntoMapa = {
  id: string;
  n: number;
  lat: number;
  lng: number;
  categoria: CategoriaPunto;
  /** Hora ya formateada (HH:mm) para el tooltip y las etiquetas. */
  hora: string;
  tipo: string;
  cliente: string;
};

const CONTENEDOR = { width: "100%", height: "300px" };
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
}: {
  puntos: readonly PuntoMapa[];
  onSeleccionar: (id: string) => void;
  enfocada?: string | null;
  onEnfocar?: (id: string | null) => void;
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

  const clave = puntos.map((p) => `${p.id}:${p.lat},${p.lng}`).join("|");
  const ajustar = (mapa: google.maps.Map) => {
    const limites = new google.maps.LatLngBounds();
    puntos.forEach((p) => limites.extend({ lat: p.lat, lng: p.lng }));
    if (puntos.length > 0) mapa.fitBounds(limites, 48);
  };
  useEffect(() => {
    if (mapaRef.current) ajustar(mapaRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const inicio = puntos[0];
  const fin = puntos.length > 1 ? puntos[puntos.length - 1] : undefined;
  const origenEtiqueta =
    typeof google !== "undefined" && google.maps?.Point ? new google.maps.Point(0, -2.6) : undefined;

  return (
    <MapaConCarga alto="300px">
      <GoogleMap
        mapContainerStyle={CONTENEDOR}
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
        {puntos.slice(1).map((p, i) => (
          <PolylineF
            key={`seg-${puntos[i].id}-${p.id}`}
            path={[
              { lat: puntos[i].lat, lng: puntos[i].lng },
              { lat: p.lat, lng: p.lng },
            ]}
            options={{
              strokeColor: colores.marca,
              // De claro a oscuro conforme avanza el día.
              strokeOpacity: 0.2 + (0.7 * (i + 1)) / Math.max(puntos.length - 1, 1),
              strokeWeight: 2,
              clickable: false,
            }}
          />
        ))}
        {puntos.map((p) => {
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
        {[
          inicio && { p: inicio, rotulo: "Inicio" },
          fin && { p: fin, rotulo: "Fin" },
        ]
          .filter((x): x is { p: PuntoMapa; rotulo: string } => Boolean(x))
          .map(({ p, rotulo }) => (
            <MarkerF
              key={`extremo-${rotulo}`}
              position={{ lat: p.lat, lng: p.lng }}
              zIndex={900}
              icon={{
                path: CIRCULO,
                scale: 9,
                fillColor: colores.marca,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
                labelOrigin: origenEtiqueta,
              }}
              label={{
                text: `${rotulo} ${p.hora}`,
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
