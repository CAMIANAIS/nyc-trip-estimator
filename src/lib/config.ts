export const API_URL: string = (import.meta.env["VITE_API_URL"] as string | undefined) || "http://localhost:8000";

/** Mock mode is on unless explicitly disabled, so the demo always works. */
export const USE_MOCK: boolean = (import.meta.env["VITE_USE_MOCK"] as string | undefined) !== "false";
