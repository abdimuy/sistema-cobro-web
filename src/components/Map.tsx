import React, { useEffect, useRef } from "react";
import { GoogleMap } from "@react-google-maps/api";

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
  height: "-webkit-fill-available",
};

const defaultCenter = {
  lat: 18.4655,
  lng: -97.392,
};

const Map: React.FC<MapProps> = ({ points = [] }) => {
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
    <div className="mt-[20px] flex rounded-lg overflow-hidden flex-1">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={points[0] || defaultCenter}
        zoom={points.length > 0 ? 15 : 12}
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
