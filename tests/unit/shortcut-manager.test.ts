import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { isEditableElement, useShortcut } from "@/lib/shortcuts";

// ─── isEditableElement ───────────────────────────────────────────

describe("isEditableElement", () => {
  it("returns false for null", () => {
    expect(isEditableElement(null)).toBe(false);
  });

  it("returns true for <input>", () => {
    const el = document.createElement("input");
    expect(isEditableElement(el)).toBe(true);
  });

  it("returns true for <textarea>", () => {
    const el = document.createElement("textarea");
    expect(isEditableElement(el)).toBe(true);
  });

  it("returns true for <select>", () => {
    const el = document.createElement("select");
    expect(isEditableElement(el)).toBe(true);
  });

  it('returns true for contenteditable="true"', () => {
    const el = document.createElement("div");
    el.setAttribute("contenteditable", "true");
    expect(isEditableElement(el)).toBe(true);
  });

  it('returns true for contenteditable="" (empty string)', () => {
    const el = document.createElement("div");
    el.setAttribute("contenteditable", "");
    expect(isEditableElement(el)).toBe(true);
  });

  it("returns true for element with .cm-editor class", () => {
    const el = document.createElement("div");
    el.classList.add("cm-editor");
    expect(isEditableElement(el)).toBe(true);
  });

  it("returns true for element inside .cm-editor parent", () => {
    const parent = document.createElement("div");
    parent.classList.add("cm-editor");
    const child = document.createElement("div");
    parent.appendChild(child);
    document.body.appendChild(parent);
    expect(isEditableElement(child)).toBe(true);
    document.body.removeChild(parent);
  });

  it("returns false for a plain <div>", () => {
    const el = document.createElement("div");
    expect(isEditableElement(el)).toBe(false);
  });

  it("returns false for a <button>", () => {
    const el = document.createElement("button");
    expect(isEditableElement(el)).toBe(false);
  });

  it("returns false for a <span>", () => {
    const el = document.createElement("span");
    expect(isEditableElement(el)).toBe(false);
  });
});

// ─── useShortcut ─────────────────────────────────────────────────

describe("useShortcut", () => {
  let handler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handler = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function fireKey(
    key: string,
    opts: Partial<KeyboardEventInit> = {}
  ) {
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
      ...opts,
    });
    document.dispatchEvent(event);
    return event;
  }

  it("fires handler on matching key press", () => {
    renderHook(() => useShortcut("n", handler));
    fireKey("n");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("is case-insensitive", () => {
    renderHook(() => useShortcut("n", handler));
    fireKey("N");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not fire for non-matching key", () => {
    renderHook(() => useShortcut("n", handler));
    fireKey("t");
    expect(handler).not.toHaveBeenCalled();
  });

  it("suppresses single-key shortcut when input is focused", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useShortcut("n", handler));
    fireKey("n");
    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("fires single-key shortcut when ignoreInputFocus is true", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() =>
      useShortcut("n", handler, { ignoreInputFocus: true })
    );
    fireKey("n");
    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });

  it("fires meta shortcut with metaKey", () => {
    renderHook(() => useShortcut("k", handler, { meta: true }));
    fireKey("k", { metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires meta shortcut with ctrlKey", () => {
    renderHook(() => useShortcut("k", handler, { meta: true }));
    fireKey("k", { ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not fire meta shortcut without modifier", () => {
    renderHook(() => useShortcut("k", handler, { meta: true }));
    fireKey("k");
    expect(handler).not.toHaveBeenCalled();
  });

  it("suppresses meta shortcut inside CodeMirror", () => {
    const cmEditor = document.createElement("div");
    cmEditor.classList.add("cm-editor");
    const cmContent = document.createElement("div");
    cmContent.setAttribute("tabindex", "0");
    cmEditor.appendChild(cmContent);
    document.body.appendChild(cmEditor);
    cmContent.focus();

    renderHook(() => useShortcut("k", handler, { meta: true }));
    fireKey("k", { metaKey: true });
    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(cmEditor);
  });

  it("meta shortcut fires when input is focused (not CodeMirror)", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useShortcut("k", handler, { meta: true }));
    fireKey("k", { metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });

  it("calls preventDefault when option is set", () => {
    renderHook(() =>
      useShortcut("n", handler, { preventDefault: true })
    );
    const event = fireKey("n");
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not call preventDefault by default", () => {
    renderHook(() => useShortcut("n", handler));
    const event = fireKey("n");
    expect(event.defaultPrevented).toBe(false);
  });

  it("deregisters listener on unmount", () => {
    const { unmount } = renderHook(() => useShortcut("n", handler));
    unmount();
    fireKey("n");
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not fire single-key shortcut when meta/ctrl is held", () => {
    renderHook(() => useShortcut("n", handler));
    fireKey("n", { metaKey: true });
    expect(handler).not.toHaveBeenCalled();
    fireKey("n", { ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });
});
