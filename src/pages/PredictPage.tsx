import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, MapPin, Route as RouteIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationInput } from "@/components/LocationInput";
import { DateTimePicker, PassengerStepper, SwapButton } from "@/components/FormControls";
import { AppAlert } from "@/components/AppAlert";
import { ResultsCard, ResultsSkeleton } from "@/features/predict/ResultsCard";
import { healthQuery } from "@/features/predict/queries";
import { errorView } from "@/features/predict/errorView";
import { getRoute, predict, reverseGeocode } from "@/lib/api";
import { USE_MOCK } from "@/lib/config";
import { coordLabel, formatDuration, formatUSD, inNYC, nyNowRounded, nyTomorrowAt, OUTSIDE_NYC_MESSAGE } from "@/lib/geo";
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

const EXAMPLE = {
  pickup: { lat: 40.758, lon: -73.9855, address: "Times Square, Manhattan" },
  dropoff: { lat: 40.6413, lon: -73.7781, address: "JFK Airport, Queens" },
};

const MapFallback = () => <div className="size-full animate-pulse bg-muted" />;

export function PredictPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { pickup: null, dropoff: null, datetime: "", passengers: 1 },
  });
  const { pickup, dropoff, datetime, passengers } = form.watch();
  const fieldErrors = form.formState.errors;
  const [activeField, setActiveField] = useState<Kind>("dropoff");
  const [mapToast, setMapToast] = useState<string | null>(null);
  const lastRequest = useRef<PredictRequest | null>(null);
  const inputRefs = { pickup: useRef<HTMLInputElement>(null), dropoff: useRef<HTMLInputElement>(null) };

  useEffect(() => {
    if (!form.getValues("datetime")) form.setValue("datetime", nyNowRounded());
  }, [form]);

  useEffect(() => {
    if (!mapToast) return;
    const t = setTimeout(() => setMapToast(null), 3000);
    return () => clearTimeout(t);
  }, [mapToast]);

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
  const errView = prediction.error ? errorView(prediction.error) : null;
  const invalidField = errView?.action === "change-location" ? (errView.field ?? null) : null;

  const setPoint = (kind: Kind, p: Place | null) => {
    form.setValue(kind, p, { shouldValidate: form.formState.isSubmitted });
    if (prediction.data || prediction.error) prediction.reset();
  };

  const placeFromMap = async (kind: Kind, lat: number, lon: number) => {
    if (!inNYC({ lat, lon })) {
      setMapToast(OUTSIDE_NYC_MESSAGE);
      return;
    }
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
      ...(route.data ? { trip_distance_miles: Math.round(route.data.distanceMiles * 100) / 100 } : {}),
    };
    lastRequest.current = req;
    prediction.mutate(req);
  });

  const reset = () => {
    form.reset({ pickup: null, dropoff: null, datetime: nyNowRounded(), passengers: 1 });
    prediction.reset();
    setMapToast(null);
    setActiveField("dropoff");
  };

  const tryExample = () => {
    form.reset({ ...EXAMPLE, datetime: nyTomorrowAt("18:30"), passengers: 1 });
    prediction.reset();
    setActiveField("dropoff");
  };

  const onErrorAction = () => {
    if (!errView) return;
    if (errView.action === "retry") {
      if (lastRequest.current) prediction.mutate(lastRequest.current);
      return;
    }
    const field = errView.field ?? "pickup";
    setActiveField(field);
    inputRefs[field].current?.focus();
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
    ? `Estimate ready: ${formatUSD(result.total_amount)}, about ${formatDuration(result.trip_duration_min)}.`
    : errView
      ? `${errView.title}. ${errView.body}`
      : mapToast ?? "";

  const fieldError = (k: Kind) =>
    invalidField === k ? errView?.body : fieldErrors[k]?.message;

  return (
    <div className="lg:grid lg:h-[calc(100dvh-3.75rem)] lg:grid-cols-[3fr_2fr]">
      <div className="relative h-[45vh] border-b lg:h-full lg:border-b-0 lg:border-r">
        <ClientOnly fallback={<MapFallback />}>
          <Suspense fallback={<MapFallback />}>
            <TripMap
              pickup={pickup}
              dropoff={dropoff}
              route={routeLatLng}
              invalid={invalidField}
              clicksDisabled={loading}
              onMapClick={handleMapClick}
              onMarkerDrag={(k, lat, lon) => void placeFromMap(k, lat, lon)}
            />
          </Suspense>
        </ClientOnly>
        {mapToast && (
          <div
            role="alert"
            className="animate-in fade-in slide-in-from-top-2 absolute left-1/2 top-16 z-[1001] flex -translate-x-1/2 items-center gap-2 rounded-full border bg-card px-4 py-2 text-small font-medium shadow-lg duration-200"
          >
            <AlertCircle className="size-4 text-destructive" aria-hidden />
            {mapToast}
          </div>
        )}
      </div>

      <div className="bg-card lg:overflow-y-auto">
        <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-6 px-4 pt-8 lg:px-8" noValidate>
          <div>
            <h1 className="text-h2 lg:text-display">Where are you headed?</h1>
            <p className="mt-1 text-muted-foreground">
              Get a fare and travel-time estimate for a NYC yellow taxi.{" "}
              <button
                type="button"
                onClick={tryExample}
                disabled={loading}
                className="inline-flex items-center gap-1 font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4"
              >
                <Sparkles className="size-3.5" aria-hidden /> Try an example
              </button>
            </p>
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-5 shadow-md">
            <div className="relative space-y-3">
              <span aria-hidden className="pointer-events-none absolute left-[18px] top-[52px] h-[60px] border-l-2 border-dotted border-muted-foreground/50" />
              <LocationInput
                kind="pickup"
                label="Pickup"
                value={pickup}
                inputRef={inputRefs.pickup}
                error={fieldError("pickup")}
                active={activeField === "pickup" && !!pickup && !!dropoff}
                disabled={loading}
                onFocus={() => setActiveField("pickup")}
                onSelect={(p) => setPoint("pickup", p)}
                onClear={() => setPoint("pickup", null)}
              />
              <LocationInput
                kind="dropoff"
                label="Dropoff"
                value={dropoff}
                inputRef={inputRefs.dropoff}
                error={fieldError("dropoff")}
                active={activeField === "dropoff" && !!pickup && !!dropoff}
                disabled={loading}
                onFocus={() => setActiveField("dropoff")}
                onSelect={(p) => setPoint("dropoff", p)}
                onClear={() => setPoint("dropoff", null)}
              />
              <div className="absolute right-12 top-[60px] z-10">
                <SwapButton onClick={swap} disabled={loading || (!pickup && !dropoff)} />
              </div>
            </div>
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

          <div className="sticky bottom-0 z-10 -mx-4 border-t bg-card/95 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
            <Button type="submit" size="lg" className="w-full" disabled={!valid} loading={loading}>
              {loading ? "Requesting…" : "Request"}
            </Button>
          </div>

          <div className="pb-10">
            {loading ? (
              <ResultsSkeleton />
            ) : errView ? (
              <AppAlert
                variant="error"
                title={errView.title}
                action={
                  <Button type="button" variant="secondary" size="sm" onClick={onErrorAction}>
                    {errView.actionLabel}
                  </Button>
                }
              >
                {errView.body}
              </AppAlert>
            ) : result ? (
              <ResultsCard result={result} onReset={reset} />
            ) : !pickup ? (
              <div className="flex items-start gap-3 rounded-lg border border-dashed p-5 text-small">
                <MapPin className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
                <p>Click the map or search an address to set your pickup</p>
              </div>
            ) : null}
          </div>
          <div aria-live="polite" className="sr-only">{liveMessage}</div>
        </form>
      </div>
    </div>
  );
}
