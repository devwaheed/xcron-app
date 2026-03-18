// Design Token System for xCron
// Single source of truth for all visual values: colors, spacing, typography, radii, shadows.

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface TokenSet {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    surface: { bg: string; bgSecondary: string; bgTertiary: string };
    neutral: ColorScale;
  };
  spacing: Record<string, string>;
  typography: {
    fontFamilies: { sans: string; mono: string };
    fontSizes: Record<string, [string, string]>; // [fontSize, lineHeight]
    fontWeights: Record<string, number>;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    full: string;
  };
  shadows: { sm: string; md: string; lg: string; xl: string };
}

// ---------------------------------------------------------------------------
// Light Token Set
// ---------------------------------------------------------------------------

export const lightTokens: TokenSet = {
  colors: {
    primary: {
      50: "#f5f3ff",
      100: "#ede9fe",
      200: "#ddd6fe",
      300: "#c4b5fd",
      400: "#a78bfa",
      500: "#7c3aed",
      600: "#6d28d9",
      700: "#5b21b6",
      800: "#4c1d95",
      900: "#3b0764",
      950: "#2e1065",
    },
    secondary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
      950: "#082f49",
    },
    accent: {
      50: "#fdf4ff",
      100: "#fae8ff",
      200: "#f5d0fe",
      300: "#f0abfc",
      400: "#e879f9",
      500: "#d946ef",
      600: "#c026d3",
      700: "#a21caf",
      800: "#86198f",
      900: "#701a75",
      950: "#4a044e",
    },
    success: {
      50: "#ecfdf5",
      100: "#d1fae5",
      200: "#a7f3d0",
      300: "#6ee7b7",
      400: "#34d399",
      500: "#10b981",
      600: "#059669",
      700: "#047857",
      800: "#065f46",
      900: "#064e3b",
      950: "#022c22",
    },
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
      950: "#451a03",
    },
    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
      950: "#450a0a",
    },
    surface: {
      bg: "#ffffff",
      bgSecondary: "#f8fafc",
      bgTertiary: "#f1f5f9",
    },
    neutral: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617",
    },
  },
  spacing: {
    "0": "0px",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "7": "28px",
    "8": "32px",
    "9": "36px",
    "10": "40px",
    "11": "44px",
    "12": "48px",
    "14": "56px",
    "16": "64px",
    "20": "80px",
    "24": "96px",
    "28": "112px",
    "32": "128px",
    "36": "144px",
    "40": "160px",
    "44": "176px",
    "48": "192px",
    "52": "208px",
    "56": "224px",
    "60": "240px",
    "64": "256px",
    "72": "288px",
    "80": "320px",
    "96": "384px",
  },
  typography: {
    fontFamilies: {
      sans: "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
      mono: "var(--font-geist-mono), ui-monospace, monospace",
    },
    fontSizes: {
      xs: ["0.75rem", "1rem"],
      sm: ["0.875rem", "1.25rem"],
      base: ["1rem", "1.5rem"],
      lg: ["1.125rem", "1.75rem"],
      xl: ["1.25rem", "1.75rem"],
      "2xl": ["1.5rem", "2rem"],
      "3xl": ["1.875rem", "2.25rem"],
      "4xl": ["2.25rem", "2.5rem"],
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  radii: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
};

// ---------------------------------------------------------------------------
// Dark Token Set
// ---------------------------------------------------------------------------

export const darkTokens: TokenSet = {
  colors: {
    primary: {
      50: "#2e1065",
      100: "#3b0764",
      200: "#4c1d95",
      300: "#5b21b6",
      400: "#6d28d9",
      500: "#a78bfa",
      600: "#c4b5fd",
      700: "#ddd6fe",
      800: "#ede9fe",
      900: "#f5f3ff",
      950: "#faf5ff",
    },
    secondary: {
      50: "#082f49",
      100: "#0c4a6e",
      200: "#075985",
      300: "#0369a1",
      400: "#0284c7",
      500: "#38bdf8",
      600: "#7dd3fc",
      700: "#bae6fd",
      800: "#e0f2fe",
      900: "#f0f9ff",
      950: "#f8faff",
    },
    accent: {
      50: "#4a044e",
      100: "#701a75",
      200: "#86198f",
      300: "#a21caf",
      400: "#c026d3",
      500: "#e879f9",
      600: "#f0abfc",
      700: "#f5d0fe",
      800: "#fae8ff",
      900: "#fdf4ff",
      950: "#fefaff",
    },
    success: {
      50: "#022c22",
      100: "#064e3b",
      200: "#065f46",
      300: "#047857",
      400: "#059669",
      500: "#34d399",
      600: "#6ee7b7",
      700: "#a7f3d0",
      800: "#d1fae5",
      900: "#ecfdf5",
      950: "#f0fdf8",
    },
    warning: {
      50: "#451a03",
      100: "#78350f",
      200: "#92400e",
      300: "#b45309",
      400: "#d97706",
      500: "#fbbf24",
      600: "#fcd34d",
      700: "#fde68a",
      800: "#fef3c7",
      900: "#fffbeb",
      950: "#fffdf5",
    },
    error: {
      50: "#450a0a",
      100: "#7f1d1d",
      200: "#991b1b",
      300: "#b91c1c",
      400: "#dc2626",
      500: "#f87171",
      600: "#fca5a5",
      700: "#fecaca",
      800: "#fee2e2",
      900: "#fef2f2",
      950: "#fff5f5",
    },
    surface: {
      bg: "#0f172a",
      bgSecondary: "#1e293b",
      bgTertiary: "#334155",
    },
    neutral: {
      50: "#020617",
      100: "#0f172a",
      200: "#1e293b",
      300: "#334155",
      400: "#475569",
      500: "#94a3b8",
      600: "#cbd5e1",
      700: "#e2e8f0",
      800: "#f1f5f9",
      900: "#f8fafc",
      950: "#ffffff",
    },
  },
  spacing: lightTokens.spacing,
  typography: lightTokens.typography,
  radii: lightTokens.radii,
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.2)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.2)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.2)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.2)",
  },
};

// ---------------------------------------------------------------------------
// Utility: Flatten a TokenSet into CSS custom properties
// ---------------------------------------------------------------------------

/**
 * Recursively flattens a nested object into a flat Record<string, string>
 * with CSS custom property names (prefixed with `--`).
 *
 * Examples:
 *   colors.primary.500 → "--color-primary-500"
 *   spacing.4          → "--spacing-4"
 *   radii.lg           → "--radius-lg"
 *   shadows.md         → "--shadow-md"
 */
export function tokensToCssProperties(
  tokens: TokenSet
): Record<string, string> {
  const result: Record<string, string> = {};

  // Map top-level token categories to their CSS prefix
  const categoryMap: Record<string, string> = {
    colors: "color",
    spacing: "spacing",
    typography: "typography",
    radii: "radius",
    shadows: "shadow",
  };

  function flatten(obj: unknown, prefix: string): void {
    if (obj === null || obj === undefined) return;

    if (typeof obj === "string" || typeof obj === "number") {
      result[`--${prefix}`] = String(obj);
      return;
    }

    if (Array.isArray(obj)) {
      // Typography fontSizes are [fontSize, lineHeight] tuples
      result[`--${prefix}`] = obj[0];
      result[`--${prefix}-line-height`] = obj[1];
      return;
    }

    if (typeof obj === "object") {
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const separator = prefix ? "-" : "";
        flatten(value, `${prefix}${separator}${key}`);
      }
    }
  }

  for (const [category, value] of Object.entries(tokens)) {
    const prefix = categoryMap[category] || category;
    flatten(value, prefix);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Utility: Token name parsing and formatting (round-trip)
// ---------------------------------------------------------------------------

export interface ParsedTokenName {
  category: string;
  path: string[];
}

// Reverse map from CSS prefix back to category
const prefixToCategoryMap: Record<string, string> = {
  color: "colors",
  spacing: "spacing",
  typography: "typography",
  radius: "radii",
  shadow: "shadows",
};

const categoryToPrefixMap: Record<string, string> = {
  colors: "color",
  spacing: "spacing",
  typography: "typography",
  radii: "radius",
  shadows: "shadow",
};

/**
 * Parses a token name string like "color-primary-500" into its category and path.
 * Handles the mapping between CSS prefixes and internal category names.
 */
export function parseTokenName(name: string): ParsedTokenName {
  // Strip leading "--" if present
  const cleaned = name.startsWith("--") ? name.slice(2) : name;

  const parts = cleaned.split("-");
  const prefix = parts[0];
  const category = prefixToCategoryMap[prefix] || prefix;
  const path = parts.slice(1);

  return { category, path };
}

/**
 * Formats a parsed token name back into a string.
 * This is the inverse of parseTokenName — together they form a round-trip.
 */
export function formatTokenName(parsed: ParsedTokenName): string {
  const prefix = categoryToPrefixMap[parsed.category] || parsed.category;
  if (parsed.path.length === 0) {
    return prefix;
  }
  return `${prefix}-${parsed.path.join("-")}`;
}
