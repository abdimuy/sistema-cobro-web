import React, { useEffect, useRef } from "react";
import { GoogleMap } from "@react-google-maps/api";

interface Point {
  lat: number;
  lng: number;
}

interface MapSimpleProps {
  point: Point;
  height?: string;
  zoom?: number;
}

const MapSimple: React.FC<MapSimpleProps> = ({ point, height = "100%", zoom = 15 }) => {
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