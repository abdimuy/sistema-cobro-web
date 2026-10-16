import { GoogleMap, Marker } from "@react-google-maps/api";
import { MapaConCarga } from "@/components/maps/MapaConCarga";

const MAP_CONTAINER_STYLE = { width: "100%", height: "220px" };

interface Props {
  lat: number;
  lng: number;
}

// FichaMapEmbed renders a Google Map centered on the client's GPS coordinates.
// The Maps script is requested through MapaConCarga — the same single loader
// and key source (obtenerLlaveGoogleMaps) as every other map — so the script
// is never injected twice and a failed load offers "Reintentar".
export function FichaMapEmbed({ lat, lng }: Props) {
  const center = { lat, lng };

  return (
    <MapaConCarga alto="220px">
      <div className="overflow-hidden rounded-md border border-border/40">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={center}
          zoom={15}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false,
          }}
        >
          <Marker position={center} />
        </GoogleMap>
      </div>
    </MapaConCarga>
  );
}
