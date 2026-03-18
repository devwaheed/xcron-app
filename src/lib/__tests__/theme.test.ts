import { describe, it, expect, beforeEach, vi } from "vitest";
import { resolveTheme, persistTheme, getPersistedTheme, ThemeMode } from "../theme";

describe("resolveTheme", () => {
  it('returns "light" when mode is "light"', () => {
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it('returns "dark" when mode is "dark"', () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it('returns "dark" when mode is "system" and systemPrefersDark is true', () => {
    expect(resolveTheme("system", true)).toBe("dark");
  });

  it('returns "light" when mode is "system" and systemPrefersDark is false', () => {
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("persistTheme / getPersistedTheme", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists and retrieves a theme mode", () => {
    const modes: ThemeMode[] = ["light", "dark", "system"];
    for (const mode of modes) {
      persistTheme(mode);
      expect(getPersistedTheme()).toBe(mode);
    }
  });

  it('returns "system" when no preference is persisted', () => {
    expect(getPersistedTheme()).toBe("system");
  });

  it('returns "system" when stored value is invalid', () => {
    localStorage.setItem("xcron-theme", "invalid-value");
    expect(getPersistedTheme()).toBe("system");
  });

  it("handles localStorage unavailability gracefully for persistTheme", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("localStorage disabled");
    });
    expect(() => persistTheme("dark")).not.toThrow();
    setItemSpy.mockRestore();
  });

  it("handles localStorage unavailability gracefully for getPersistedTheme", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("localStorage disabled");
    });
    expect(getPersistedTheme()).toBe("system");
    getItemSpy.mockRestore();
  });
});
