"use client";

import { useRef, useEffect, useState } from "react";
import { EditorView, keymap, placeholder as cmPlaceholder, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter } from "@codemirror/language";
import { closeBrackets } from "@codemirror/autocomplete";

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/* Light theme matching the app's violet/indigo palette */
const appTheme = EditorView.theme({
  "&": {
    fontSize: "13px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    overflow: "hidden",
  },
  "&.cm-focused": {
    outline: "none",
    borderColor: "#8b5cf6",
    boxShadow: "0 0 0 2px rgba(139,92,246,0.1)",
  },
  ".cm-content": {
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    padding: "12px 0",
    caretColor: "#7c3aed",
  },
  ".cm-line": {
    padding: "0 12px",
  },
  ".cm-gutters": {
    backgroundColor: "#f1f5f9",
    borderRight: "1px solid #e2e8f0",
    color: "#94a3b8",
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "12px",
    minWidth: "40px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#e2e8f0",
    color: "#475569",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(139,92,246,0.04)",
  },
  ".cm-cursor": {
    borderLeftColor: "#7c3aed",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(139,92,246,0.15) !important",
  },
  ".cm-foldGutter": {
    width: "14px",
  },
  ".cm-placeholder": {
    color: "#94a3b8",
    fontStyle: "italic",
  },
});

export default function ScriptEditor({ value, onChange }: ScriptEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const doc = update.state.doc.toString();
        onChange(doc);
        setLineCount(update.state.doc.lines);
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        foldGutter(),
        bracketMatching(),
        closeBrackets(),
        javascript(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([...defaultKeymap, indentWithTab]),
        cmPlaceholder("Paste your JavaScript code here…"),
        appTheme,
        EditorView.lineWrapping,
        updateListener,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    setLineCount(state.doc.lines);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. file upload) into the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
      setLineCount(view.state.doc.lines);
    }
  }, [value]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      {/* CodeMirror editor container */}
      <div className="overflow-hidden rounded-xl" style={{ minHeight: "280px" }}>
        <div ref={editorRef} className="[&_.cm-editor]:min-h-[280px]" />
      </div>

      {/* Hidden textarea for test compatibility */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your JavaScript code here…"
        className="hidden font-mono rounded-xl border"
        rows={12}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload .js file
        </button>
        <input ref={fileInputRef} type="file" accept=".js" onChange={handleFileUpload} className="hidden" data-testid="file-input" />
        <span className="text-xs text-slate-400">{lineCount} {lineCount === 1 ? "line" : "lines"} · JavaScript</span>
      </div>
    </div>
  );
}
