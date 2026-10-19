import { ApiError } from "@/lib/errors";

export interface ErrorView {
  title: string;
  body: string;
  action: "retry" | "change-location" | "focus-field";
  actionLabel: string;
  field?: "pickup" | "dropoff" | undefined;
}

export function errorView(err: Error): ErrorView {
  const code = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
  const field = err instanceof ApiError ? err.field : undefined;
  const message = err.message;
  const retry = { action: "retry" as const, actionLabel: "Try again" };
  switch (code) {
    case "VALIDATION_ERROR":
      return { title: "Check your trip details", body: message, action: "focus-field", actionLabel: "Review details", field };
    case "OUT_OF_SERVICE_AREA":
      return {
        title: "Location outside service area",
        body: message || "Estimates are currently available only for trips within Manhattan, JFK and LaGuardia airports.",
        action: "change-location",
        actionLabel: "Change location",
        field,
      };
    case "ROUTE_NOT_FOUND":
      return { title: "We couldn't find a route", body: "Try moving the pickup or dropoff closer to a street.", action: "change-location", actionLabel: "Change location", field };
    case "ROUTING_SERVICE_UNAVAILABLE":
      return { title: "Route service unavailable", body: "We couldn't calculate the distance right now.", ...retry };
    case "MODEL_UNAVAILABLE":
      return { title: "Prediction unavailable", body: "Our model is temporarily unavailable.", ...retry };
    case "NETWORK_ERROR":
      return { title: "Can't reach the service", body: "Check your connection and try again.", ...retry };
    default:
      // For unknown errors, show the API message if available
      return { title: "Something went wrong", body: message || "We couldn't get your estimate.", ...retry };
  }
}
