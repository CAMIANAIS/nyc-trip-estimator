import type { HealthResponse, ModelMetric, PredictRequest, PredictResponse, Zone, LatLon } from "@/types/api";
import { ApiError } from "./errors";
import { haversineMiles, inNYC } from "./geo";

const ZONES: (Zone & LatLon)[] = [
  { location_id: 230, name: "Times Sq/Theatre District", borough: "Manhattan", lat: 40.758, lon: -73.9855 },
  { location_id: 161, name: "Midtown Center", borough: "Manhattan", lat: 40.7549, lon: -73.984 },
  { location_id: 87, name: "Financial District North", borough: "Manhattan", lat: 40.7075, lon: -74.0085 },
  { location_id: 236, name: "Upper East Side North", borough: "Manhattan", lat: 40.7794, lon: -73.9535 },
  { location_id: 166, name: "Morningside Heights", borough: "Manhattan", lat: 40.8075, lon: -73.9626 },
  { location_id: 132, name: "JFK Airport", borough: "Queens", lat: 40.6413, lon: -73.7781 },
  { location_id: 138, name: "LaGuardia Airport", borough: "Queens", lat: 40.7769, lon: -73.874 },
  { location_id: 7, name: "Astoria", borough: "Queens", lat: 40.7644, lon: -73.9235 },
  { location_id: 181, name: "Park Slope", borough: "Brooklyn", lat: 40.671, lon: -73.9814 },
  { location_id: 255, name: "Williamsburg (North Side)", borough: "Brooklyn", lat: 40.7181, lon: -73.9571 },
  { location_id: 69, name: "East Concourse/Concourse Village", borough: "Bronx", lat: 40.8261, lon: -73.9196 },
  { location_id: 206, name: "Saint George/New Brighton", borough: "Staten Island", lat: 40.6437, lon: -74.0776 },
];

function nearestZone(p: LatLon): Zone {
  let best = ZONES[0];
  let bestD = Infinity;
  for (const z of ZONES) {
    const d = haversineMiles(p, z);
    if (d < bestD) {
      bestD = d;
      best = z;
    }
  }
  return { location_id: best.location_id, name: best.name, borough: best.borough };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function mockHealth(): Promise<HealthResponse> {
  return { status: "ok", models_loaded: true };
}

export async function mockPredict(req: PredictRequest, distanceMiles?: number): Promise<PredictResponse> {
  await sleep(800);
  if (!inNYC(req.pickup)) throw new ApiError("OUT_OF_SERVICE_AREA", "Pickup location is outside NYC taxi zones.");
  if (!inNYC(req.dropoff)) throw new ApiError("OUT_OF_SERVICE_AREA", "Dropoff location is outside NYC taxi zones.");

  const miles = round2(distanceMiles ?? haversineMiles(req.pickup, req.dropoff) * 1.3);
  const fare = round2(3 + 2.5 * miles);
  const pz = nearestZone(req.pickup);
  const dz = nearestZone(req.dropoff);
  const charges = [{ label: "MTA tax", amount: 0.5 }, { label: "Improvement surcharge", amount: 1.0 }];
  if (pz.borough === "Manhattan" || dz.borough === "Manhattan")
    charges.push({ label: "Congestion surcharge", amount: 2.5 });
  if ([132, 138].includes(pz.location_id)) charges.push({ label: "Airport fee", amount: 1.75 });

  return {
    fare_amount: fare,
    total_amount: round2(fare + charges.reduce((s, c) => s + c.amount, 0)),
    trip_duration_min: Math.round((miles / 12) * 60 * 10) / 10,
    trip_distance_miles: miles,
    pickup_zone: pz,
    dropoff_zone: dz,
    charges,
    model_version: "mock-fare-v0 / mock-duration-v0",
  };
}

/** Placeholder metrics — replace with real evaluation results. */
export const MODEL_METRICS: ModelMetric[] = [
  { model: "Linear Regression", maeFare: 3.42, rmseFare: 6.1, maeDuration: 5.8, trainingTime: "4 s", inferenceTime: "0.02 ms" },
  { model: "Decision Tree", maeFare: 2.31, rmseFare: 4.9, maeDuration: 4.6, trainingTime: "38 s", inferenceTime: "0.05 ms" },
  { model: "Random Forest", maeFare: 1.86, rmseFare: 3.9, maeDuration: 3.9, trainingTime: "6 min", inferenceTime: "1.8 ms" },
  { model: "LightGBM", maeFare: 1.71, rmseFare: 3.6, maeDuration: 3.6, trainingTime: "52 s", inferenceTime: "0.3 ms" },
  { model: "XGBoost", maeFare: 1.64, rmseFare: 3.5, maeDuration: 3.5, trainingTime: "1.5 min", inferenceTime: "0.4 ms", selected: true },
  { model: "MLP", maeFare: 1.95, rmseFare: 4.0, maeDuration: 4.1, trainingTime: "9 min", inferenceTime: "0.6 ms" },
];
