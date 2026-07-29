"use client";

interface CursorView {
  connectionId: number;
  color: string;
  x: number;
  y: number;
}

interface PresenceLayerProps {
  cursors: CursorView[];
}

export function PresenceLayer({ cursors }: PresenceLayerProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {cursors.map((cursor) => (
        <div
          key={cursor.connectionId}
          className="absolute transition-transform duration-75 ease-linear"
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        >
          <div
            className="h-3 w-3 rounded-full border border-white/70"
            style={{ backgroundColor: cursor.color }}
          />
        </div>
      ))}
    </div>
  );
}
