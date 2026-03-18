/**
 * Centralized API error handling for the frontend.
 *
 * All API routes return errors in the shape: { error: string, details?: string, fields?: string[] }
 * This module provides a consistent way to parse those responses and surface
 * user-friendly messages across every page.
 */

/** Parsed error from an API response */
export interface ApiError {
  /** HTTP status code */
  status: number;
  /** User-facing error message */
  message: string;
  /** Optional detailed message from the server */
  details?: string;
  /** Validation field errors (400 responses) */
  fields?: string[];
}

/**
 * Parse a non-ok Response into a structured ApiError.
 * Safe to call on any failed response — gracefully handles unparseable bodies.
 */
export async function parseApiResponse(res: Response, fallback: string): Promise<ApiError> {
  let message = fallback;
  let details: string | undefined;
  let fields: string[] | undefined;

  try {
    const data = await res.json();
    if (data.error) message = data.error;
    if (data.details) details = data.details;
    if (Array.isArray(data.fields)) fields = data.fields;
  } catch {
    // Response body wasn't JSON — use fallback
  }

  return {
    status: res.status,
    message: details ? `${message}: ${details}` : message,
    details,
    fields,
  };
}

/**
 * Build a user-friendly error message from a network failure (fetch threw).
 */
export function networkErrorMessage(context: string): string {
  return `Connection failed: ${context}. Check your network and try again.`;
}

/** Status-specific messages that don't need server body parsing */
const STATUS_MESSAGES: Record<number, string> = {
  401: "Session expired. Redirecting to login…",
  429: "Rate limit exceeded. Please wait and try again.",
};

/**
 * Check if a response has a well-known status that should be handled
 * before parsing the body (e.g. 401 redirect, 429 rate limit).
 * Returns the message if matched, undefined otherwise.
 */
export function getStatusMessage(status: number): string | undefined {
  return STATUS_MESSAGES[status];
}

/** Whether a 502 status indicates a service connectivity issue */
export function isServiceError(status: number): boolean {
  return status === 502;
}
