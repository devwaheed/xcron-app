/**
 * Maps service-level errors to user-friendly messages.
 * Used by API routes to provide clear feedback when external services fail.
 */

export function friendlyServiceError(service: string, error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.includes("401") || raw.includes("403") || raw.includes("Bad credentials")) {
    return `${service} authentication failed. The API token may be expired or invalid. Please check your configuration.`;
  }

  if (raw.includes("404")) {
    return `${service} resource not found. The repository or endpoint may have been deleted or renamed.`;
  }

  if (raw.includes("422")) {
    return `${service} rejected the request. The data may be malformed or a duplicate.`;
  }

  if (raw.includes("rate limit") || raw.includes("429")) {
    return `${service} rate limit exceeded. Please wait a few minutes and try again.`;
  }

  if (raw.includes("ECONNREFUSED") || raw.includes("ENOTFOUND") || raw.includes("fetch failed")) {
    return `Cannot reach ${service}. The service may be temporarily unavailable. Please try again later.`;
  }

  if (raw.includes("timeout") || raw.includes("ETIMEDOUT")) {
    return `${service} request timed out. The service may be experiencing high load.`;
  }

  return `${service} operation failed: ${raw.length > 200 ? raw.slice(0, 200) + "…" : raw}`;
}
