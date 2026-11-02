import { GoogleMap, Marker } from "@react-google-maps/api";
import { MapaConCarga } from "@/components/maps/MapaConCarga";
import { useEstilosDeMapa } from "@/components/maps/estilosDeMapa";

interface Props {
  lat: number;
  lng: number;
  /** Alto CSS del mapa; 220px por omisión. */
  alto?: string;
}

// FichaMapEmbed renders a Google Map centered on the client's GPS coordinates.
// The Maps script is requested through MapaConCarga — the same single loader
// and key source (obtenerLlaveGoogleMaps) as every other map — so the script
// is never injected twice and a failed load offers "Reintentar".
export function FichaMapEmbed({ lat, lng, alto = "220px" }: Props) {
  const center = { lat, lng };
  const estilos = useEstilosDeMapa();

  return (
    <MapaConCarga alto={alto}>
      <div className="overflow-hidden rounded-md border border-border/40">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: alto }}
          center={center}
          zoom={15}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false,
            styles: estilos,
          }}
        >
          <Marker position={center} />
        </GoogleMap>
      </div>
    </MapaConCarga>
  );
}
