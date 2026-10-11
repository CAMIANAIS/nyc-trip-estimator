import type {
  ApiErrorBody,
  GeocodeResult,
  HealthResponse,
  LatLon,
  PredictRequest,
  PredictResponse,
  RouteResult,
  LineStringGeometry,
} from "@/types/api";
import { API_URL } from "./config";
import { ApiError, NETWORK_ERROR_MESSAGE } from "./errors";
import { mockPredict } from "./mock";
import { shortAddress } from "./geo";

/* ---------------- Prediction API (FastAPI) ---------------- */

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json();
}

export async function predict(
  req: PredictRequest,
  opts: { mock: boolean; distanceMiles?: number | undefined },
): Promise<PredictResponse> {
  if (opts.mock) return mockPredict(req, opts.distanceMiles);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", NETWORK_ERROR_MESSAGE);
  }
  if (!res.ok) {
    let body: Partial<ApiErrorBody> | null = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(
      body?.error?.code ?? "INTERNAL_ERROR",
      body?.error?.message ?? `The prediction service returned an error (${res.status}).`,
      body?.error?.field,
    );
  }
  return res.json();
}

/* ---------------- Nominatim (OpenStreetMap) ---------------- */

const NOMINATIM = "https://nominatim.openstreetmap.org";
const NYC_PARAMS = "viewbox=-74.26,40.92,-73.70,40.49&bounded=1&countrycodes=us";

// Nominatim usage policy: max 1 request per second.
let nextSlot = 0;
async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = now + wait + 1000;
  if (wait) await new Promise((r) => setTimeout(r, wait));
}

interface NominatimItem {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

export async function searchAddress(q: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  await throttle();
  const url = `${NOMINATIM}/search?format=jsonv2&limit=6&${NYC_PARAMS}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal: signal ?? null, headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error("Address search failed");
  const items: NominatimItem[] = await res.json();
  return items.map((i) => ({
    id: String(i.place_id),
    lat: parseFloat(i.lat),
    lon: parseFloat(i.lon),
    address: shortAddress(i.display_name),
  }));
}

export async function reverseGeocode(p: LatLon): Promise<string | null> {
  await throttle();
  try {
    const res = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=18&lat=${p.lat}&lon=${p.lon}`, {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) return null;
    const data: { display_name?: string } = await res.json();
    return data.display_name ? shortAddress(data.display_name) : null;
  } catch {
    return null;
  }
}

/* ---------------- OSRM route preview ---------------- */

export async function getRoute(a: LatLon, b: LatLon): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("Route service unavailable");
  const data: { code: string; routes?: { geometry: LineStringGeometry; distance: number; duration: number }[] } =
    await res.json();
  const r = data.routes?.[0];
  if (data.code !== "Ok" || !r) throw new Error("No route found");
  return { geometry: r.geometry, distanceMiles: r.distance / 1609.344, durationMin: r.duration / 60 };
}
