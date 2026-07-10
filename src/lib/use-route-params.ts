import { use } from "react";

/** Unwrap route params on Next 14 (sync) and Next 15+ (Promise). */
export function useRouteParams<T extends Record<string, string>>(
  params: T | Promise<T>
): T {
  if (params != null && typeof (params as Promise<T>).then === "function") {
    return use(params as Promise<T>);
  }
  return params as T;
}
