export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "xcron-theme";
const VALID_MODES: ThemeMode[] = ["light", "dark", "system"];

/**
 * Pure function that resolves a ThemeMode to an applied theme ("light" | "dark").
 * - "light" → "light"
 * - "dark" → "dark"
 * - "system" → uses systemPrefersDark to decide
 */
export function resolveTheme(
  mode: ThemeMode,
  systemPrefersDark: boolean
): "light" | "dark" {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  return systemPrefersDark ? "dark" : "light";
}

/**
 * Persists the user's theme preference to localStorage.
 * Silently no-ops if localStorage is unavailable.
 */
export function persistTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage unavailable (private browsing, quota exceeded, SSR) — silently ignore
  }
}

/**
 * Reads the persisted theme preference from localStorage.
 * Returns "system" if localStorage is unavailable or the stored value is invalid.
 */
export function getPersistedTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_MODES.includes(stored as ThemeMode)) {
      return stored as ThemeMode;
    }
  } catch {
    // localStorage unavailable — fall through to default
  }
  return "system";
}
