# NYC Taxi Fare & Duration Predictor — Frontend

Pick a pickup and dropoff in New York City and get a predicted taxi fare and trip duration from our ML models (FastAPI backend). Works offline in mock mode for demos.

## Run locally
```bash
npm install
cp .env.example .env   # adjust if needed
npm run dev
```

## Environment variables
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | FastAPI base URL (`/health`, `/predict`) |
| `VITE_USE_MOCK` | `true` | When the API is unreachable, return realistic mock predictions |

## Docker
```bash
docker build --build-arg VITE_API_URL=https://api.example.com -t nyc-taxi-web .
docker run -p 8080:80 nyc-taxi-web
```

## Structure
- `src/types/api.ts` — API types · `src/lib/api.ts` — all API calls · `src/lib/mock.ts` — mock data
- `src/components` — reusable UI · `src/features/predict` — map & results · `src/pages` — pages
- Map data © OpenStreetMap contributors; geocoding by Nominatim; routing by OSRM.
