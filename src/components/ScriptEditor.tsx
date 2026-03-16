"use client";

import { useRef } from "react";

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ScriptEditor({ value, onChange }: ScriptEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsText(file);

    // Reset so the same file can be re-uploaded
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your JavaScript code here…"
        rows={12}
        className="w-full resize-y rounded-lg border border-white/10 bg-white/5 p-4 font-mono text-sm text-white placeholder-white/40 backdrop-blur-xl focus:border-white/30 focus:outline-none"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Upload .js file
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".js"
          onChange={handleFileUpload}
          className="hidden"
          data-testid="file-input"
        />
      </div>
    </div>
  );
}
