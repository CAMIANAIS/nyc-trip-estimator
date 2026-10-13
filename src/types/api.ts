export interface LatLon {
  lat: number;
  lon: number;
}

export interface PredictRequest {
  pickup: LatLon;
  dropoff: LatLon;
  /** New York local time, ISO without offset, e.g. 2026-10-10T18:30:00 */
  pickup_datetime: string;
  passenger_count: number;
  /** Route distance from OSRM, in miles. Omitted if the route couldn't be calculated. */
  trip_distance_miles?: number;
}

export interface Zone {
  location_id: number;
  name: string;
  borough: string;
}

export interface Charge {
  label: string;
  amount: number;
  /** Optional explanation shown in an info tooltip */
  description?: string;
}

export interface LineStringGeometry {
  type: "LineString";
  /** [lon, lat] pairs */
  coordinates: [number, number][];
}

export interface PredictResponse {
  fare_amount: number;
  total_amount: number;
  trip_duration_min: number;
  trip_distance_miles: number;
  pickup_zone: Zone;
  dropoff_zone: Zone;
  route_geometry?: LineStringGeometry;
  charges?: Charge[];
  model_version: string;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "OUT_OF_SERVICE_AREA"
  | "ROUTE_NOT_FOUND"
  | "ROUTING_SERVICE_UNAVAILABLE"
  | "MODEL_UNAVAILABLE"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string; field?: "pickup" | "dropoff" };
}

export interface HealthResponse {
  status: string;
  models_loaded: boolean;
}

/** A point selected by the user, with a human-readable address. */
export interface Place extends LatLon {
  address: string;
}

export interface GeocodeResult extends Place {
  id: string;
}

export interface RouteResult {
  geometry: LineStringGeometry;
  distanceMiles: number;
  durationMin: number;
}

export interface ModelMetric {
  model: string;
  maeFare: number;
  rmseFare: number;
  maeDuration: number;
  trainingTime: string;
  inferenceTime: string;
  selected?: boolean;
}
