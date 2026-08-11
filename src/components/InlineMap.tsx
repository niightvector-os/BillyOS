"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";

export type Location = { name: string; description: string; lat: number; lng: number };

export default function InlineMap({ locations }: { locations: Location[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || mapInstance.current || locations.length === 0) return;

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: true }).setView(
        [locations[0].lat, locations[0].lng],
        locations.length > 1 ? 4 : 11
      );
      mapInstance.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        maxZoom: 19,
      }).addTo(map);

      const bounds: [number, number][] = [];
      locations.forEach((loc) => {
        L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(`<strong>${loc.name}</strong><br/>${loc.description}`);
        bounds.push([loc.lat, loc.lng]);
      });

      if (locations.length > 1) map.fitBounds(bounds, { padding: [30, 30] });
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [locations]);

  return <div className="inline-map" ref={mapRef} />;
}
