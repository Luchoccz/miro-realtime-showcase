"use client";

import { MousePointer2, StickyNote } from "lucide-react";

interface ToolbarProps {
  onCreateSticky: () => void;
  isMutating: boolean;
}

export function Toolbar({ onCreateSticky, isMutating }: ToolbarProps) {
  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-zinc-800/30 bg-zinc-950/95 px-3 py-2 text-zinc-100 shadow-lg shadow-zinc-950/40 backdrop-blur">
      <button
        type="button"
        onClick={onCreateSticky}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
      >
        <StickyNote className="size-4" />
        Nueva nota
      </button>
      <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300">
        <MousePointer2 className="size-3.5" />
        {isMutating ? "Sincronizando" : "En vivo"}
      </div>
    </div>
  );
}
