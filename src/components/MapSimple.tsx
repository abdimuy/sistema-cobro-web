import React, { useEffect, useRef } from "react";
import { GoogleMap } from "@react-google-maps/api";
import { useTheme } from "../context/ThemeContext";

interface Point {
  lat: number;
  lng: number;
}

interface MapSimpleProps {
  point: Point;
  height?: string;
  zoom?: number;
}

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

const MapSimple: React.FC<MapSimpleProps> = ({ point, height = "100%", zoom = 15 }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const containerStyle = {
    width: "100%",
    height: height,
  };

  useEffect(() => {
    if (mapRef.current && point) {
      mapRef.current.setCenter(point);
      if (markerRef.current) {
        markerRef.current.setPosition(point);
      } else {
        markerRef.current = new google.maps.Marker({
          position: point,
          map: mapRef.current,
          animation: google.maps.Animation.DROP,
        });
      }
    }
  }, [point]);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={point}
      zoom={zoom}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        styles: isDark ? darkMapStyles : undefined,
      }}
      onLoad={(map) => {
        mapRef.current = map;
        markerRef.current = new google.maps.Marker({
          position: point,
          map: map,
          animation: google.maps.Animation.DROP,
        });
      }}
    />
  );
};

export default MapSimple;