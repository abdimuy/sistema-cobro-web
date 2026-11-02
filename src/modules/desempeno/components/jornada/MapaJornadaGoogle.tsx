import { GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api";
import { MapaConCarga } from "@/components/maps/MapaConCarga";
import { useEstilosDeMapa } from "@/components/maps/estilosDeMapa";

export type PuntoMapa = { id: string; n: number; lat: number; lng: number };

const CONTENEDOR = { width: "100%", height: "300px" };

// Cargado en diferido desde MapaJornada. El script de Maps lo pide
// MapaConCarga, con la misma llave y cargador que el resto de los mapas.
export function MapaJornadaGoogle({
  puntos,
  onSeleccionar,
}: {
  puntos: readonly PuntoMapa[];
  onSeleccionar: (id: string) => void;
}) {
  const estilos = useEstilosDeMapa();
  return (
    <MapaConCarga alto="300px">
      <GoogleMap
        mapContainerStyle={CONTENEDOR}
        onLoad={(mapa) => {
          const limites = new google.maps.LatLngBounds();
          puntos.forEach((p) => limites.extend({ lat: p.lat, lng: p.lng }));
          if (puntos.length > 0) mapa.fitBounds(limites, 32);
        }}
        options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false, styles: estilos }}
      >
        <PolylineF
          path={puntos.map((p) => ({ lat: p.lat, lng: p.lng }))}
          options={{ strokeOpacity: 0.35, strokeWeight: 1.5 }}
        />
        {puntos.map((p) => (
          <MarkerF
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            label={{ text: String(p.n), fontSize: "10px", color: "#ffffff" }}
            onClick={() => onSeleccionar(p.id)}
          />
        ))}
      </GoogleMap>
    </MapaConCarga>
  );
}
