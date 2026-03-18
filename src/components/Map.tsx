import React, { useEffect, useRef } from "react";
import { GoogleMap } from "@react-google-maps/api";
import { useTheme } from "../context/ThemeContext";

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
//   const markerRef = useRef<google.maps.Marker | null>(null);

//   useEffect(() => {
//     if (mapRef.current && point) {
//       mapRef.current.setCenter(point);
//       if (markerRef.current) {
//         markerRef.current.setPosition(point);
//       } else {
//         markerRef.current = new google.maps.Marker({
//           position: point,
//           map: mapRef.current,
//         });
//       }
//     }
//   }, [point]);

//   if (!point) {
//     return null;
//   }

//   return (
//     <div className="mt-[20px] rounded-lg overflow-hidden">
//       <GoogleMap
//         mapContainerStyle={containerStyle}
//         center={point || defaultCenter}
//         zoom={point ? 15 : 12}
//         onLoad={(map) => {
//           mapRef.current = map;
//           if (point) {
//             markerRef.current = new google.maps.Marker({
//               position: point,
//               map: map,
//             });
//           }
//         }}
//       />
//     </div>
//   );
// };

// export default Map;

interface Point {
  lat: number;
  lng: number;
}

interface MapProps {
  points?: Point[];
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 18.4655,
  lng: -97.392,
};

const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#999999" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#555555" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#b0b0b0" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#888888" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1b3a1b" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#4a4a4a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#333333" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#aaaaaa" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#5c5c5c" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#444444" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f2f2f" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6b8cae" }] },
];

const Map: React.FC<MapProps> = ({ points = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (mapRef.current) {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      points.forEach((point) => {
        const marker = new google.maps.Marker({
          position: point,
          map: mapRef.current,
        });
        markersRef.current.push(marker);
      });

      if (points.length > 0) {
        mapRef.current.setCenter(points[0]);
      }
    }
  }, [points]);

  if (points.length === 0) {
    return null;
  }

  return (
    <div className="flex rounded-lg overflow-hidden flex-1 h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={points[0] || defaultCenter}
        zoom={points.length > 0 ? 15 : 12}
        options={{
          styles: isDark ? darkMapStyles : undefined,
        }}
        onLoad={(map) => {
          mapRef.current = map;
          points.forEach((point) => {
            const marker = new google.maps.Marker({
              position: point,
              map: map,
            });
            markersRef.current.push(marker);
          });
        }}
      />
    </div>
  );
};

export default Map;
