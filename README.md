# NYC Taxi Fare & Duration Predictor — Frontend

Pick a pickup and dropoff in New York City and get a predicted taxi fare and trip duration from our ML models (FastAPI backend). Works offline in mock mode for demos.

## Prerequisites

- Node.js 18+ installed
- FastAPI backend running on `http://localhost:8000` (for local integration)
- OR a public backend URL (for production)

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd nyc-trip-estimator
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` based on your setup:

#### Local development (with backend on localhost)
```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=false
```

#### Local development (mock mode, no backend needed)
```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=true
```

#### Production (with public backend URL)
```env
VITE_API_URL=https://your-backend-url.com
VITE_USE_MOCK=false
```

### 3. Run the frontend

```bash
npm run dev
```

Opens at http://localhost:8080

---

## 🏗️ Deployment

### Local Development

1. Make sure your FastAPI backend is running on `http://localhost:8000`
2. Set `VITE_USE_MOCK=false` in `.env`
3. Run `npm run dev`
4. Open http://localhost:8080

### Production (Vercel)

1. Deploy your backend to a hosting service (Railway, Render, Fly.io, AWS, etc.)
2. Get the public URL (e.g., `https://my-api.railway.app`)
3. Go to your Vercel project → Settings → Environment Variables
4. Add these variables:
   - `VITE_API_URL` = `https://my-api.railway.app`
   - `VITE_USE_MOCK` = `false`
5. Redeploy your Vercel project

### Production (Docker)

```bash
docker build --build-arg VITE_API_URL=https://your-backend-url.com -t nyc-taxi-web .
docker run -p 8080:80 nyc-taxi-web
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | FastAPI base URL (`/health`, `/predict`) |
| `VITE_USE_MOCK` | `false` | `true` = use mock data when API unreachable, `false` = use real API |

**Important:** `VITE_USE_MOCK=false` requires the backend to be accessible at `VITE_API_URL`.

---

## API Integration

The frontend sends a POST request to `${VITE_API_URL}/predict` with this body:

```json
{
  "pickup": { "lat": 40.759, "lon": -73.985 },
  "dropoff": { "lat": 40.758, "lon": -73.978 },
  "pickup_datetime": "2026-10-16T18:00:00",
  "passenger_count": 1,
  "trip_distance_miles": 1.2
}
```

Expected response:

```json
{
  "trip_distance_miles": 1.2,
  "pickup_zone": { "location_id": 230, "name": "Times Sq/Theatre District", "borough": "Manhattan" },
  "dropoff_zone": { "location_id": 161, "name": "Midtown Center", "borough": "Manhattan" },
  "fare_amount": 7.55,
  "trip_duration_min": 9.63,
  "total_amount": 7.55,
  "model_version": "fare_v2_duration_v3"
}
```

---

## Structure

- `src/types/api.ts` — API types · `src/lib/api.ts` — all API calls · `src/lib/mock.ts` — mock data
- `src/components` — reusable UI · `src/features/predict` — map & results · `src/pages` — pages
- Map data © OpenStreetMap contributors; geocoding by Nominatim; routing by OSRM.
