"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Location = { name: string; description: string; lat: number; lng: number };
type RouteLeg = { distanceKm: number; durationMin: number };
type Routes = { driving: RouteLeg | null; walking: RouteLeg | null; cycling: RouteLeg | null; geometry: [number, number][] };

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function MapView({
  topic,
  locations,
  isRoute,
  routes,
  onClose,
}: {
  topic: string;
  locations: Location[];
  isRoute?: boolean;
  routes?: Routes;
  onClose: () => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || mapInstance.current) return;

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      const map = L.map(mapRef.current, { zoomControl: true }).setView(
        [locations[0].lat, locations[0].lng],
        locations.length > 1 ? 4 : 12
      );
      mapInstance.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19,
      }).addTo(map);

      const bounds: [number, number][] = [];
      locations.forEach((loc) => {
        L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(`<strong>${loc.name}</strong><br/>${loc.description}`);
        bounds.push([loc.lat, loc.lng]);
      });

      if (isRoute && routes && routes.geometry.length > 0) {
        const line = L.polyline(routes.geometry, { color: "#EF4444", weight: 4, opacity: 0.85 }).addTo(map);
        map.fitBounds(line.getBounds(), { padding: [50, 50] });
      } else if (locations.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      // Real "my location" dot — browser geolocation, free, no third party. Fails silently if denied.
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled || !mapInstance.current) return;
            L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
              radius: 7,
              fillColor: "#7C6CFF",
              fillOpacity: 1,
              color: "#fff",
              weight: 2,
            })
              .addTo(mapInstance.current)
              .bindPopup("Your location");
          },
          () => {},
          { timeout: 5000 }
        );
      }
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [locations, isRoute, routes]);

  return (
    <div className="study-overlay">
      <div className="map-panel">
        <div className="study-header" style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <div>
            <div className="study-label">{isRoute ? "DISTANCE" : "FIND ON MAP"}</div>
            <h2 className="study-title">{topic}</h2>
          </div>
          <button className="study-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="map-container" ref={mapRef} />

        {isRoute && routes ? (
          <div className="route-modes">
            {routes.driving && (
              <div className="route-mode-card">
                <span className="route-mode-icon">🚗</span>
                <span className="route-mode-label">Driving</span>
                <span className="route-mode-value">{routes.driving.distanceKm} km · {formatDuration(routes.driving.durationMin)}</span>
              </div>
            )}
            {routes.walking && (
              <div className="route-mode-card">
                <span className="route-mode-icon">🚶</span>
                <span className="route-mode-label">Walking</span>
                <span className="route-mode-value">{routes.walking.distanceKm} km · {formatDuration(routes.walking.durationMin)}</span>
              </div>
            )}
            {routes.cycling && (
              <div className="route-mode-card">
                <span className="route-mode-icon">🚴</span>
                <span className="route-mode-label">Cycling</span>
                <span className="route-mode-value">{routes.cycling.distanceKm} km · {formatDuration(routes.cycling.durationMin)}</span>
              </div>
            )}
            {!routes.driving && !routes.walking && !routes.cycling && (
              <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
                These two places are too far apart for a direct road/path route — showing straight-line locations instead.
              </p>
            )}
          </div>
        ) : (
          <div className="map-list">
            {locations.map((loc, i) => (
              <div key={i} className="map-list-item">
                <span className="map-list-name">{loc.name}</span>
                <span className="map-list-desc">{loc.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
