// import React, { useEffect, useRef } from "react";
// import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

// interface Point {
//   lat: number;
//   lng: number;
// }

// interface MapProps {
//   point?: Point;
// }

// const containerStyle = {
//   width: "100%",
//   height: "700px",
// };

// const defaultCenter = {
//   lat: 18.4655,
//   lng: -97.392,
// };

// const Map: React.FC<MapProps> = ({ point }) => {
//   const mapRef = useRef<google.maps.Map | null>(null);
//   console.log("point", point);
//   if (!point) {
//     return null;
//   }

//   return (
//     <div className="mt-4">
//       <LoadScript googleMapsApiKey="AIzaSyCASwsCJvFm7dGajUWlVg19PmS8JVPqRaY">
//         {/* Reemplaza con tu API Key */}
//         <GoogleMap
//           mapContainerStyle={containerStyle}
//           center={point || defaultCenter}
//           zoom={point ? 15 : 12}
//           onLoad={(map) => {
//             mapRef.current = map;
//           }}
//         >
//           {point && <Marker position={point} />}
//         </GoogleMap>
//       </LoadScript>
//     </div>
//   );
// };

// export default Map;

import React, { useEffect, useRef } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

interface Point {
  lat: number;
  lng: number;
}

interface MapProps {
  point?: Point;
}

const containerStyle = {
  width: "100%",
  height: "700px",
};

const defaultCenter = {
  lat: 18.4655,
  lng: -97.392,
};

const Map: React.FC<MapProps> = ({ point }) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (mapRef.current && point) {
      mapRef.current.setCenter(point);
      if (markerRef.current) {
        markerRef.current.setPosition(point);
      } else {
        markerRef.current = new google.maps.Marker({
          position: point,
          map: mapRef.current,
        });
      }
    }
  }, [point]);

  if (!point) {
    return null;
  }

  return (
    <div className="mt-4">
      <LoadScript googleMapsApiKey="AIzaSyCASwsCJvFm7dGajUWlVg19PmS8JVPqRaY">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={point || defaultCenter}
          zoom={point ? 15 : 12}
          onLoad={(map) => {
            mapRef.current = map;
            if (point) {
              markerRef.current = new google.maps.Marker({
                position: point,
                map: map,
              });
            }
          }}
        />
      </LoadScript>
    </div>
  );
};

export default Map;
