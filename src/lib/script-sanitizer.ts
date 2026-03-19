/**
 * Script content sanitizer.
 * Validates and sanitizes user-provided JavaScript before committing to GitHub.
 * This is a defense-in-depth measure — GitHub Actions sandboxing is the primary security boundary.
 */

export interface SanitizeResult {
  valid: boolean;
  errors: string[];
  sanitized: string;
}

const MAX_SCRIPT_SIZE = 50_000; // 50KB max

/** Patterns that indicate potentially dangerous operations */
const BLOCKED_PATTERNS: { pattern: RegExp; message: string }[] = [
  { pattern: /process\.env\.(GITHUB_PAT|SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|STRIPE_SECRET_KEY)/i, message: "Script must not reference server secrets" },
  { pattern: /child_process/i, message: "child_process module is not allowed" },
  { pattern: /require\s*\(\s*['"]fs['"]\s*\)/i, message: "Direct fs module access is not allowed — use fetch for I/O" },
  { pattern: /eval\s*\(/i, message: "eval() is not allowed" },
  { pattern: /Function\s*\(/i, message: "Function constructor is not allowed" },
];

export function sanitizeScript(content: string): SanitizeResult {
  const errors: string[] = [];

  if (!content || typeof content !== "string") {
    return { valid: false, errors: ["Script content is required"], sanitized: "" };
  }

  if (content.length > MAX_SCRIPT_SIZE) {
    errors.push(`Script exceeds maximum size of ${MAX_SCRIPT_SIZE / 1000}KB`);
  }

  for (const { pattern, message } of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(message);
    }
  }

  // Strip null bytes and other control characters (except newlines/tabs)
  const sanitized = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}
