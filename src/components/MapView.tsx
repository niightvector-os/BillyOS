"use client";

import { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";

type Location = { name: string; description: string; lat: number; lng: number };
type RouteLeg = { distanceKm: number; durationMin: number };
type ImageResult = { title: string; url: string; pageUrl: string };
type Routes = { driving: RouteLeg | null; walking: RouteLeg | null; cycling: RouteLeg | null; geometry: [number, number][] };

export type MapEntry = {
  topic: string;
  locations: Location[];
  isRoute?: boolean;
  routes?: Routes;
  explanation?: string | null;
  images?: ImageResult[];
};

export type MapData = { entries: MapEntry[] };

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function MapEntryView({ entry, isLatest, mapRef }: { entry: MapEntry; isLatest: boolean; mapRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="visualize-entry">
      <h3 className="visualize-entry-question">{entry.topic}</h3>

      {isLatest && <div className="map-container" ref={mapRef} />}

      {entry.isRoute && entry.routes ? (
        <div className="route-modes">
          {entry.routes.driving && (
            <div className="route-mode-card">
              <span className="route-mode-icon">🚗</span>
              <span className="route-mode-label">Driving</span>
              <span className="route-mode-value">{entry.routes.driving.distanceKm} km · {formatDuration(entry.routes.driving.durationMin)}</span>
            </div>
          )}
          {entry.routes.walking && (
            <div className="route-mode-card">
              <span className="route-mode-icon">🚶</span>
              <span className="route-mode-label">Walking</span>
              <span className="route-mode-value">{entry.routes.walking.distanceKm} km · {formatDuration(entry.routes.walking.durationMin)}</span>
            </div>
          )}
          {entry.routes.cycling && (
            <div className="route-mode-card">
              <span className="route-mode-icon">🚴</span>
              <span className="route-mode-label">Cycling</span>
              <span className="route-mode-value">{entry.routes.cycling.distanceKm} km · {formatDuration(entry.routes.cycling.durationMin)}</span>
            </div>
          )}
          {!entry.routes.driving && !entry.routes.walking && !entry.routes.cycling && (
            <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
              These two places are too far apart for a direct road/path route — showing straight-line locations instead.
            </p>
          )}
        </div>
      ) : (
        <div className="map-list">
          {entry.locations.map((loc, i) => (
            <div key={i} className="map-list-item">
              <span className="map-list-name">{loc.name}</span>
              <span className="map-list-desc">{loc.description}</span>
            </div>
          ))}
        </div>
      )}

      {entry.images && entry.images.length > 0 && (
        <div className="map-image-strip">
          {entry.images.map((img, i) => (
            <a key={i} href={img.pageUrl} target="_blank" rel="noopener noreferrer" className="map-image-item">
              <img src={img.url} alt={img.title} loading="lazy" />
            </a>
          ))}
        </div>
      )}

      {entry.explanation && (
        <div className="map-explanation md-content">
          {entry.explanation.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MapView({
  data,
  onClose,
  onFollowUp,
  loading,
}: {
  data: MapData;
  onClose: () => void;
  onFollowUp: (topic: string) => void;
  loading?: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const [followUpInput, setFollowUpInput] = useState("");
  const latest = data.entries[data.entries.length - 1];

  useEffect(() => {
    let cancelled = false;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || mapInstance.current || latest.locations.length === 0) return;

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      const map = L.map(mapRef.current, { zoomControl: true }).setView(
        [latest.locations[0].lat, latest.locations[0].lng],
        latest.locations.length > 1 ? 4 : 12
      );
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const bounds: [number, number][] = [];
      latest.locations.forEach((loc) => {
        L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(`<strong>${loc.name}</strong><br/>${loc.description}`);
        bounds.push([loc.lat, loc.lng]);
      });

      if (latest.isRoute && latest.routes && latest.routes.geometry.length > 0) {
        const line = L.polyline(latest.routes.geometry, { color: "#EF4444", weight: 4, opacity: 0.85 }).addTo(map);
        map.fitBounds(line.getBounds(), { padding: [50, 50] });
      } else if (latest.locations.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }

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
  }, [latest]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!followUpInput.trim() || loading) return;
    onFollowUp(followUpInput);
    setFollowUpInput("");
  }

  return (
    <div className="study-overlay">
      <div className="map-panel">
        <div className="study-header" style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <div>
            <div className="study-label">{latest.isRoute ? "DISTANCE" : "FIND ON MAP"}</div>
            <h2 className="study-title">{latest.topic}</h2>
          </div>
          <button className="study-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          {data.entries.map((entry, i) => (
            <MapEntryView key={i} entry={entry} isLatest={i === data.entries.length - 1} mapRef={mapRef} />
          ))}
          {loading && <p className="thinking-text">Finding locations...</p>}
        </div>

        <form className="visualize-followup-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="auth-input"
            placeholder="Ask a follow-up in this Map session..."
            value={followUpInput}
            onChange={(e) => setFollowUpInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="icon-btn" aria-label="Send" disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
