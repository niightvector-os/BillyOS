export type RouteLeg = { distanceKm: number; durationMin: number };
export type RouteResult = {
  driving: RouteLeg | null;
  walking: RouteLeg | null;
  cycling: RouteLeg | null;
  geometry: [number, number][]; // [lat, lng] pairs for drawing the line
};

const OSRM_PROFILES: Record<string, string> = {
  driving: "driving",
  walking: "foot",
  cycling: "bike",
};

async function fetchOneProfile(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  profile: string
): Promise<{ leg: RouteLeg; geometry: [number, number][] } | null> {
  const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route) return null;

  const geometry: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
  return {
    leg: { distanceKm: Math.round((route.distance / 1000) * 10) / 10, durationMin: Math.round(route.duration / 60) },
    geometry,
  };
}

export async function fetchAllRoutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteResult> {
  const [driving, walking, cycling] = await Promise.all([
    fetchOneProfile(origin, destination, OSRM_PROFILES.driving).catch(() => null),
    fetchOneProfile(origin, destination, OSRM_PROFILES.walking).catch(() => null),
    fetchOneProfile(origin, destination, OSRM_PROFILES.cycling).catch(() => null),
  ]);

  // Prefer the driving geometry for the drawn line (most representative for long distances);
  // fall back to whichever succeeded.
  const geometry = driving?.geometry || walking?.geometry || cycling?.geometry || [];

  return {
    driving: driving?.leg || null,
    walking: walking?.leg || null,
    cycling: cycling?.leg || null,
    geometry,
  };
}
