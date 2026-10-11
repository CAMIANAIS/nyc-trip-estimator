import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationInput } from "@/components/LocationInput";
import { DateTimePicker, PassengerStepper, SwapButton } from "@/components/FormControls";
import { AppAlert } from "@/components/AppAlert";
import { ResultsCard, ResultsSkeleton } from "@/features/predict/ResultsCard";
import { healthQuery } from "@/features/predict/queries";
import { getRoute, predict, reverseGeocode } from "@/lib/api";
import { USE_MOCK } from "@/lib/config";
import { coordLabel, formatUSD, inNYC, nyNowRounded, OUTSIDE_NYC_MESSAGE } from "@/lib/geo";
import type { Place, PredictRequest } from "@/types/api";

const TripMap = lazy(() => import("@/features/predict/TripMap"));

const placeSchema = z.object({ lat: z.number(), lon: z.number(), address: z.string() });
const schema = z.object({
  pickup: placeSchema.nullable().refine((p) => !!p && inNYC(p), OUTSIDE_NYC_MESSAGE),
  dropoff: placeSchema.nullable().refine((p) => !!p && inNYC(p), OUTSIDE_NYC_MESSAGE),
  datetime: z.string().min(16, "Choose a trip date and time"),
  passengers: z.number().int().min(1).max(6),
});
type FormValues = z.infer<typeof schema>;
type Kind = "pickup" | "dropoff";

const MapFallback = () => <div className="size-full animate-pulse bg-muted" />;

export function PredictPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { pickup: null, dropoff: null, datetime: "", passengers: 1 },
  });
  const { pickup, dropoff, datetime, passengers } = form.watch();
  const [activeField, setActiveField] = useState<Kind>("dropoff");
  const [warning, setWarning] = useState<string | null>(null);
  const lastRequest = useRef<PredictRequest | null>(null);

  useEffect(() => {
    if (!form.getValues("datetime")) form.setValue("datetime", nyNowRounded());
  }, [form]);

  const health = useQuery(healthQuery);
  const mock = health.data?.status !== "ok" && USE_MOCK;

  const route = useQuery({
    queryKey: ["route", pickup?.lat, pickup?.lon, dropoff?.lat, dropoff?.lon],
    queryFn: () => getRoute(pickup!, dropoff!),
    enabled: !!pickup && !!dropoff,
    retry: 1,
    staleTime: Infinity,
  });

  const prediction = useMutation({
    mutationFn: (req: PredictRequest) => predict(req, { mock, distanceMiles: route.data?.distanceMiles }),
  });
  const loading = prediction.isPending;
  const result = prediction.data;

  const setPoint = (kind: Kind, p: Place | null) => {
    form.setValue(kind, p, { shouldValidate: false });
    if (prediction.data || prediction.error) prediction.reset();
  };

  const placeFromMap = async (kind: Kind, lat: number, lon: number) => {
    if (!inNYC({ lat, lon })) {
      setWarning(OUTSIDE_NYC_MESSAGE);
      return;
    }
    setWarning(null);
    setPoint(kind, { lat, lon, address: coordLabel({ lat, lon }) });
    const name = await reverseGeocode({ lat, lon });
    const current = form.getValues(kind);
    if (name && current && current.lat === lat && current.lon === lon) form.setValue(kind, { lat, lon, address: name });
  };

  const handleMapClick = (lat: number, lon: number) => {
    if (loading) return;
    const target: Kind = !pickup ? "pickup" : !dropoff ? "dropoff" : activeField;
    if (!pickup) setActiveField("dropoff");
    void placeFromMap(target, lat, lon);
  };

  const swap = () => {
    const p = form.getValues("pickup");
    const d = form.getValues("dropoff");
    setPoint("pickup", d);
    setPoint("dropoff", p);
  };

  const onSubmit = form.handleSubmit((v) => {
    const req: PredictRequest = {
      pickup: { lat: v.pickup!.lat, lon: v.pickup!.lon },
      dropoff: { lat: v.dropoff!.lat, lon: v.dropoff!.lon },
      pickup_datetime: `${v.datetime.slice(0, 16)}:00`,
      passenger_count: v.passengers,
    };
    lastRequest.current = req;
    prediction.mutate(req);
  });

  const reset = () => {
    form.reset({ pickup: null, dropoff: null, datetime: nyNowRounded(), passengers: 1 });
    prediction.reset();
    setWarning(null);
    setActiveField("dropoff");
  };

  const valid = !!pickup && !!dropoff && inNYC(pickup) && inNYC(dropoff);
  const geometry = result?.route_geometry ?? route.data?.geometry;
  const routeLatLng = geometry ? geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]) : null;

  const distanceText = result
    ? `${result.trip_distance_miles.toFixed(1)} mi`
    : route.data
      ? `≈ ${route.data.distanceMiles.toFixed(1)} mi (estimated route)`
      : pickup && dropoff
        ? route.isFetching ? "Calculating route…" : "Route unavailable"
        : "—";

  const liveMessage = result
    ? `Estimate ready: ${formatUSD(result.total_amount)}, about ${Math.round(result.trip_duration_min)} minutes.`
    : prediction.error
      ? `Error: ${prediction.error.message}`
      : warning ?? "";

  return (
    <div className="lg:grid lg:h-[calc(100dvh-3.75rem)] lg:grid-cols-[3fr_2fr]">
      <div className="relative h-[45vh] border-b lg:h-full lg:border-b-0 lg:border-r">
        <ClientOnly fallback={<MapFallback />}>
          <Suspense fallback={<MapFallback />}>
            <TripMap
              pickup={pickup}
              dropoff={dropoff}
              route={routeLatLng}
              clicksDisabled={loading}
              onMapClick={handleMapClick}
              onMarkerDrag={(k, lat, lon) => void placeFromMap(k, lat, lon)}
            />
          </Suspense>
        </ClientOnly>
      </div>

      <div className="lg:overflow-y-auto">
        <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5 px-4 pt-6 lg:px-6" noValidate>
          <div>
            <h1 className="text-h2 lg:text-display">Where are you headed?</h1>
            <p className="mt-1 text-muted-foreground">Get a fare and travel-time estimate for a NYC yellow taxi.</p>
          </div>

          <div className="space-y-3 rounded-lg border bg-card p-4 shadow-md">
            <LocationInput
              kind="pickup"
              label="Pickup"
              value={pickup}
              active={activeField === "pickup" && !!pickup && !!dropoff}
              disabled={loading}
              onFocus={() => setActiveField("pickup")}
              onSelect={(p) => { setWarning(null); setPoint("pickup", p); }}
              onClear={() => setPoint("pickup", null)}
            />
            <div className="flex justify-end -my-2">
              <SwapButton onClick={swap} disabled={loading || (!pickup && !dropoff)} />
            </div>
            <LocationInput
              kind="dropoff"
              label="Dropoff"
              value={dropoff}
              active={activeField === "dropoff" && !!pickup && !!dropoff}
              disabled={loading}
              onFocus={() => setActiveField("dropoff")}
              onSelect={(p) => { setWarning(null); setPoint("dropoff", p); }}
              onClear={() => setPoint("dropoff", null)}
            />
            {warning && <p className="text-small font-medium text-destructive" role="alert">{warning}</p>}
            {pickup && dropoff && (
              <p className="text-small text-muted-foreground">
                Tip: focus a field, then click the map to move that point. Markers are draggable.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <DateTimePicker id="trip-time" value={datetime} onChange={(v) => form.setValue("datetime", v)} disabled={loading} />
              <PassengerStepper value={passengers} onChange={(v) => form.setValue("passengers", v)} disabled={loading} />
            </div>
            <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-small">
              <span className="flex items-center gap-2 text-muted-foreground"><RouteIcon className="size-4" aria-hidden />Distance</span>
              <span className="font-semibold tabular-nums">{distanceText}</span>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
            <Button type="submit" size="lg" className="w-full" disabled={!valid} loading={loading}>
              {loading ? "Predicting…" : "Predict fare"}
            </Button>
          </div>

          <div className="pb-8">
            {loading ? (
              <ResultsSkeleton />
            ) : prediction.error ? (
              <AppAlert
                variant="error"
                title="We couldn't get an estimate"
                action={
                  <Button type="button" variant="secondary" size="sm" onClick={() => lastRequest.current && prediction.mutate(lastRequest.current)}>
                    Try again
                  </Button>
                }
              >
                {prediction.error.message}
              </AppAlert>
            ) : result ? (
              <ResultsCard result={result} tripTime={datetime} onReset={reset} />
            ) : !pickup ? (
              <div className="flex items-start gap-3 rounded-lg border border-dashed bg-card p-4 text-small">
                <MapPin className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
                <p>Click the map or search an address to set your pickup</p>
              </div>
            ) : null}
            {mock && !health.isPending && (
              <p className="mt-3 text-center text-small text-muted-foreground">Prediction service offline — showing demo estimates.</p>
            )}
          </div>
          <div aria-live="polite" className="sr-only">{liveMessage}</div>
        </form>
      </div>
    </div>
  );
}
