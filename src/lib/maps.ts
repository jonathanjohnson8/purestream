// Google Maps server-side helpers: geocoding + Directions route optimization.
// All functions degrade gracefully when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is absent
// so the app remains fully functional before the key is provided.

const KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Austin downtown — fallback anchor for POC geocoding without a key.
const AUSTIN = { lat: 30.2672, lng: -97.7431 };

export interface LatLng {
  lat: number;
  lng: number;
}

export async function geocode(address: string): Promise<LatLng> {
  if (!KEY) {
    // Deterministic jitter around Austin so pins are distinguishable in the demo.
    const seed = Array.from(address).reduce((s, c) => s + c.charCodeAt(0), 0);
    return {
      lat: AUSTIN.lat + ((seed % 100) - 50) / 1000,
      lng: AUSTIN.lng + (((seed >> 3) % 100) - 50) / 1000,
    };
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    const loc = json?.results?.[0]?.geometry?.location;
    if (loc) return { lat: loc.lat, lng: loc.lng };
  } catch {}
  return AUSTIN;
}

export interface OptimizedRoute {
  order: number[]; // optimized index order of the waypoints
  distanceMiles: number;
  durationMin: number;
  polyline: string | null;
}

/**
 * Optimize a multi-stop route. Uses Google Directions with optimize:true when a
 * key is configured; otherwise returns a nearest-neighbor ordering with a
 * haversine distance estimate so dispatch still works in the POC.
 */
export async function optimizeRoute(
  origin: LatLng,
  waypoints: LatLng[],
  destination: LatLng
): Promise<OptimizedRoute> {
  if (KEY && waypoints.length > 0) {
    try {
      const wp = "optimize:true|" + waypoints.map((w) => `${w.lat},${w.lng}`).join("|");
      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${origin.lat},${origin.lng}` +
        `&destination=${destination.lat},${destination.lng}` +
        `&waypoints=${encodeURIComponent(wp)}&key=${KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      const route = json?.routes?.[0];
      if (route) {
        const legs = route.legs ?? [];
        const meters = legs.reduce((s: number, l: any) => s + (l.distance?.value ?? 0), 0);
        const secs = legs.reduce((s: number, l: any) => s + (l.duration?.value ?? 0), 0);
        return {
          order: route.waypoint_order ?? waypoints.map((_, i) => i),
          distanceMiles: Math.round((meters / 1609.34) * 10) / 10,
          durationMin: Math.round(secs / 60),
          polyline: route.overview_polyline?.points ?? null,
        };
      }
    } catch {}
  }
  // Fallback: nearest-neighbor ordering.
  return nearestNeighbor(origin, waypoints);
}

export function haversineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

function nearestNeighbor(origin: LatLng, waypoints: LatLng[]): OptimizedRoute {
  const remaining = waypoints.map((w, i) => ({ w, i }));
  const order: number[] = [];
  let cur = origin;
  let dist = 0;
  while (remaining.length) {
    let best = 0;
    let bestD = Infinity;
    remaining.forEach((r, idx) => {
      const d = haversineMiles(cur, r.w);
      if (d < bestD) {
        bestD = d;
        best = idx;
      }
    });
    dist += bestD;
    const [chosen] = remaining.splice(best, 1);
    order.push(chosen.i);
    cur = chosen.w;
  }
  return {
    order,
    distanceMiles: Math.round(dist * 10) / 10,
    durationMin: Math.round(dist * 3 + waypoints.length * 5),
    polyline: null,
  };
}
