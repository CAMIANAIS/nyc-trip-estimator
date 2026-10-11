import type { LatLon } from "@/types/api";

export const NYC_CENTER: [number, number] = [40.7128, -74.006];
export const NYC_ZOOM = 11;
export const NYC_BBOX = { west: -74.26, north: 40.92, east: -73.7, south: 40.49 };
export const OUTSIDE_NYC_MESSAGE = "Please choose a location within New York City";

export function inNYC(p: LatLon): boolean {
  return (
    p.lat >= NYC_BBOX.south && p.lat <= NYC_BBOX.north && p.lon >= NYC_BBOX.west && p.lon <= NYC_BBOX.east
  );
}

export function haversineMiles(a: LatLon, b: LatLon): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function shortAddress(displayName: string): string {
  return displayName.split(",").slice(0, 3).join(",").trim();
}

export function coordLabel(p: LatLon): string {
  return `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
}

/** Current New York time rounded up to the next 15 minutes, as "YYYY-MM-DDTHH:mm". */
export function nyNowRounded(): string {
  const step = 15 * 60 * 1000;
  const t = Math.ceil(Date.now() / step) * step;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(t));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Formats a NY-local "YYYY-MM-DDTHH:mm" string for display (no timezone conversion). */
export function formatTripTime(local: string): string {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return local;
  const [, y, mo, da, h, mi] = m.map(Number) as number[];
  const d = new Date(Date.UTC(y!, mo! - 1, da!, h!, mi!));
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d) + " ET"
  );
}

/** Rounded minutes; "1 h 12 min" above 60. */
export function formatDuration(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

/** Tomorrow at HH:mm, New York time, as "YYYY-MM-DDTHH:mm". */
export function nyTomorrowAt(time: string): string {
  const [y, mo, d] = nyNowRounded().slice(0, 10).split("-").map(Number) as number[];
  const t = new Date(Date.UTC(y!, mo! - 1, d! + 1));
  return `${t.toISOString().slice(0, 10)}T${time}`;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const formatUSD = (n: number) => usd.format(n);
