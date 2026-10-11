import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/pages/AboutPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the model — NYC Taxi Predictor" },
      { name: "description", content: "How our ML models predict NYC taxi fares and trip durations, with model comparison metrics." },
      { property: "og:title", content: "About the model — NYC Taxi Predictor" },
      { property: "og:description", content: "Model comparison, error metrics and architecture of the NYC taxi fare predictor." },
    ],
  }),
  component: AboutPage,
});
