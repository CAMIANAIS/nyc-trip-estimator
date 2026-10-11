import { createFileRoute } from "@tanstack/react-router";
import { PredictPage } from "@/pages/PredictPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NYC Taxi Fare & Duration Predictor" },
      { name: "description", content: "Pick a pickup and dropoff in New York City and get an ML-predicted taxi fare and trip time." },
      { property: "og:title", content: "NYC Taxi Fare & Duration Predictor" },
      { property: "og:description", content: "ML-predicted NYC yellow taxi fares and trip durations on an interactive map." },
    ],
  }),
  component: PredictPage,
});
