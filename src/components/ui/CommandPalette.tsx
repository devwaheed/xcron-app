"use client";

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import type { Action } from "@/types";

// ---------------------------------------------------------------------------
// useMediaQuery hook
// ---------------------------------------------------------------------------

/**
 * Reactive hook that tracks whether a CSS media query matches.
 * SSR-safe: returns `false` on the server.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Command {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: "navigation" | "action" | "settings";
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
  actions?: Action[];
}

// ---------------------------------------------------------------------------
// Fuzzy matching
// ---------------------------------------------------------------------------

/**
 * Character-by-character sequential fuzzy match with gap penalty.
 * Consecutive matches score higher than matches with gaps.
 */
export function fuzzyMatch(
  query: string,
  text: string
): { matches: boolean; score: number } {
  if (query.length === 0) return { matches: true, score: 0 };

  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();

  let qi = 0;
  let score = 0;
  let consecutive = 0;

  for (let ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
    if (lowerText[ti] === lowerQuery[qi]) {
      // Reward consecutive matches, penalise gaps
      consecutive += 1;
      score += consecutive; // 1 for first, 2 for second consecutive, etc.
      qi++;
    } else {
      consecutive = 0;
    }
  }

  const matched = qi === lowerQuery.length;
  return { matches: matched, score: matched ? score : 0 };
}

/**
 * Filter and sort commands by fuzzy match score (descending).
 * Empty query returns all commands.
 */
export function filterCommands(
  query: string,
  commands: Command[]
): Command[] {
  if (query.length === 0) return commands;

  const scored = commands
    .map((cmd) => ({ cmd, ...fuzzyMatch(query, cmd.label) }))
    .filter((r) => r.matches);

  scored.sort((a, b) => b.score - a.score);
  return scored.map((r) => r.cmd);
}

// ---------------------------------------------------------------------------
// Focusable-element helpers
// ---------------------------------------------------------------------------

const FOCUSABLE_SELECTOR =
  'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommandPalette({
  open,
  onClose,
  commands,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isMobile = useMediaQuery("(max-width: 639px)");

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Derived: filtered command list
  const filtered = filterCommands(query, commands);

  // ---- Open / close side-effects ----

  // Capture previously focused element & reset state when opening
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure the DOM is painted
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Restore focus on close
  useEffect(() => {
    if (!open && previousFocusRef.current) {
      const el = previousFocusRef.current;
      if (typeof el.focus === "function") {
        el.focus();
      }
    }
  }, [open]);

  // ---- Keep selectedIndex in bounds when filtered list changes ----
  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= filtered.length) {
      setSelectedIndex(filtered.length - 1);
    }
  }, [filtered.length, selectedIndex]);

  // ---- Scroll selected item into view ----
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLElement>("[data-command-item]");
    const item = items[selectedIndex];
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // ---- Execute a command ----
  const executeCommand = useCallback(
    (cmd: Command) => {
      onClose();
      cmd.action();
    },
    [onClose]
  );

  // ---- Keyboard handling ----
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length === 0 ? 0 : Math.min(prev + 1, filtered.length - 1)
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (filtered.length > 0 && selectedIndex < filtered.length) {
          executeCommand(filtered[selectedIndex]);
        }
        return;
      }

      // Focus trapping: Tab / Shift+Tab
      if (e.key === "Tab" && overlayRef.current) {
        const focusable =
          overlayRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [open, onClose, filtered, selectedIndex, executeCommand]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ---- Render ----
  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className={
        isMobile
          ? "fixed inset-0 z-50 flex items-end"
          : "fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      }
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
      data-testid="command-palette-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className={
          isMobile
            ? "w-full overflow-hidden rounded-t-2xl"
            : "mx-4 w-full max-w-lg overflow-hidden rounded-[var(--radius-xl)]"
        }
        style={{
          backgroundColor: "var(--color-surface-bg)",
          border: "1px solid var(--color-neutral-200)",
          boxShadow: "var(--shadow-xl)",
          ...(isMobile ? { maxHeight: "60vh" } : {}),
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="command-palette-dialog"
      >
        {/* Search input */}
        <div
          className="flex items-center gap-2 border-b px-4 py-3"
          style={{ borderColor: "var(--color-neutral-200)" }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ color: "var(--color-neutral-400)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--color-neutral-900)" }}
            data-testid="command-palette-input"
          />
        </div>

        {/* Command list */}
        <ul
          ref={listRef}
          role="listbox"
          className={
            isMobile
              ? "overflow-y-auto py-2 flex-1"
              : "max-h-72 overflow-y-auto py-2"
          }
          data-testid="command-palette-list"
        >
          {filtered.length === 0 ? (
            <li
              className="px-4 py-6 text-center text-sm"
              style={{ color: "var(--color-neutral-400)" }}
              data-testid="command-palette-empty"
            >
              No results found
            </li>
          ) : (
            filtered.map((cmd, index) => (
              <li
                key={cmd.id}
                role="option"
                aria-selected={index === selectedIndex}
                data-command-item
                tabIndex={-1}
                className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm"
                style={{
                  backgroundColor:
                    index === selectedIndex
                      ? "var(--color-primary-50, rgba(124, 58, 237, 0.08))"
                      : "transparent",
                  color: "var(--color-neutral-900)",
                }}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {cmd.icon && (
                  <span
                    className="flex-shrink-0"
                    style={{ color: "var(--color-neutral-500)" }}
                  >
                    {cmd.icon}
                  </span>
                )}
                <span className="flex-1">{cmd.label}</span>
                {cmd.shortcut && (
                  <kbd
                    className="rounded px-1.5 py-0.5 text-xs"
                    style={{
                      backgroundColor: "var(--color-surface-bgSecondary, var(--color-neutral-100))",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    {cmd.shortcut}
                  </kbd>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
