import { queryOptions } from "@tanstack/react-query";
import { getHealth } from "@/lib/api";

export const healthQuery = queryOptions({
  queryKey: ["health"],
  queryFn: getHealth,
  retry: false,
  staleTime: 60_000,
  refetchOnWindowFocus: false,
});
