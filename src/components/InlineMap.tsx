"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";

export type Location = { name: string; description: string; lat: number; lng: number };

export default function InlineMap({ locations }: { locations: Location[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

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

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
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

  // Leaflet needs an explicit size recalculation after the container's
  // dimensions change (entering/exiting fullscreen), or the map renders
  // stretched/blank until the next manual pan or zoom.
  useEffect(() => {
    if (mapInstance.current) {
      setTimeout(() => mapInstance.current?.invalidateSize(), 50);
    }
  }, [fullscreen]);

  return (
    <div className={fullscreen ? "inline-map-fullscreen-overlay" : "inline-map-wrap"}>
      <button
        className="inline-map-fullscreen-btn"
        onClick={() => setFullscreen((f) => !f)}
        aria-label={fullscreen ? "Exit fullscreen" : "View fullscreen"}
        data-tooltip={fullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {fullscreen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 4v4a1 1 0 0 1-1 1H4M15 4v4a1 1 0 0 0 1 1h4M9 20v-4a1 1 0 0 0-1-1H4M15 20v-4a1 1 0 0 1 1-1h4" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" />
          </svg>
        )}
      </button>
      <div className="inline-map" ref={mapRef} />
    </div>
  );
}
