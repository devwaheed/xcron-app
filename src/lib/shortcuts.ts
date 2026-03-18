"use client";

import { useEffect } from "react";

export interface ShortcutOptions {
  /** If true, shortcut fires even when an input is focused */
  ignoreInputFocus?: boolean;
  /** If true, calls event.preventDefault() */
  preventDefault?: boolean;
  /** If true, checks for metaKey (Mac) or ctrlKey (Windows/Linux) */
  meta?: boolean;
}

const EDITABLE_TAG_NAMES = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Checks if the given element is an editable field where single-key
 * shortcuts should be suppressed.
 *
 * Returns true for: input, textarea, select, contenteditable, and
 * CodeMirror editor elements.
 */
export function isEditableElement(el: Element | null): boolean {
  if (!el) return false;

  // Check tag name for input, textarea, select
  if (EDITABLE_TAG_NAMES.has(el.tagName)) return true;

  // Check contenteditable attribute
  if (el.getAttribute("contenteditable") === "true" || el.getAttribute("contenteditable") === "") {
    return true;
  }

  // Check for CodeMirror: element itself has .cm-editor or a parent does
  if (el.classList.contains("cm-editor")) return true;
  if (el.closest(".cm-editor")) return true;

  return false;
}

/**
 * Returns true if the active element is inside a CodeMirror editor.
 */
function isInCodeMirror(el: Element | null): boolean {
  if (!el) return false;
  if (el.classList.contains("cm-editor")) return true;
  if (el.closest(".cm-editor")) return true;
  return false;
}

/**
 * Hook that registers a global keyboard shortcut on mount and
 * deregisters it on unmount.
 *
 * - Single-key shortcuts (no meta) are suppressed when an editable
 *   element is focused.
 * - Meta-key shortcuts (Cmd/Ctrl+key) fire regardless of focus,
 *   unless the focus is inside a CodeMirror editor.
 * - Browser-native shortcuts are not overridden.
 */
export function useShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  options?: ShortcutOptions
): void {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const isMeta = options?.meta === true;
      const targetKey = key.toLowerCase();

      // For meta shortcuts, require Cmd (Mac) or Ctrl (Win/Linux)
      if (isMeta) {
        const hasMetaOrCtrl = e.metaKey || e.ctrlKey;
        if (!hasMetaOrCtrl) return;
        if (e.key.toLowerCase() !== targetKey) return;

        // Suppress meta shortcuts inside CodeMirror to avoid
        // conflicting with editor keybindings
        const activeEl = document.activeElement;
        if (isInCodeMirror(activeEl)) return;
      } else {
        // Single-key shortcut: must not have meta/ctrl modifiers
        if (e.metaKey || e.ctrlKey) return;
        if (e.key.toLowerCase() !== targetKey) return;

        // Suppress single-key shortcuts when editable element is focused
        // unless explicitly told to ignore input focus
        if (!options?.ignoreInputFocus) {
          const activeEl = document.activeElement;
          if (isEditableElement(activeEl)) return;
        }
      }

      if (options?.preventDefault) {
        e.preventDefault();
      }

      handler(e);
    };

    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, [key, handler, options?.meta, options?.ignoreInputFocus, options?.preventDefault]);
}
