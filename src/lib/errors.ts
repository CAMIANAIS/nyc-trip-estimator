import type { ApiErrorCode } from "@/types/api";

export const NETWORK_ERROR_MESSAGE =
  "Can't reach the prediction service. Check your connection and try again.";

export class ApiError extends Error {
  code: ApiErrorCode;
  field: "pickup" | "dropoff" | undefined;
  constructor(code: ApiErrorCode, message: string, field?: "pickup" | "dropoff") {
    super(message);
    this.code = code;
    this.field = field;
    this.name = "ApiError";
  }
}
