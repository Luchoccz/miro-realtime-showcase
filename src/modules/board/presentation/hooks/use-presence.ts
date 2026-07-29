"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { throttle } from "@/shared/lib/perf/throttle";
import { useLocalRealtime } from "@/shared/realtime/local-realtime-provider";

interface SmoothedCursor {
  connectionId: number;
  color: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

function colorFromConnectionId(connectionId: number): string {
  const palette = ["#ff5f45", "#3ca8ff", "#f9bc2d", "#4cc38a", "#ff76b9"];
  return palette[Math.abs(connectionId) % palette.length] ?? "#3ca8ff";
}

export function usePresence() {
  const { myPresence, updateMyPresence, others, status } = useLocalRealtime();
  const [smoothed, setSmoothed] = useState<SmoothedCursor[]>([]);
  const smoothedRef = useRef<SmoothedCursor[]>([]);
  const rafId = useRef<number | null>(null);

  const publishPointer = useMemo(
    () =>
      throttle((x: number, y: number) => {
        updateMyPresence({ cursor: { x, y } });
      }, 16),
    [updateMyPresence],
  );

  useEffect(() => {
    const animate = () => {
      setSmoothed((prev) =>
        prev.map((cursor) => ({
          ...cursor,
          x: cursor.x + (cursor.targetX - cursor.x) * 0.22,
          y: cursor.y + (cursor.targetY - cursor.y) * 0.22,
        })),
      );
      rafId.current = window.requestAnimationFrame(animate);
    };

    rafId.current = window.requestAnimationFrame(animate);
    return () => {
      if (rafId.current) {
        window.cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  useEffect(() => {
    smoothedRef.current = smoothed;
  }, [smoothed]);

  useEffect(() => {
    const next = others
      .filter((other) => other.presence.cursor)
      .map((other) => {
        const previous = smoothedRef.current.find((item) => item.connectionId === other.connectionId);
        const target = other.presence.cursor!;

        return {
          connectionId: other.connectionId,
          color: colorFromConnectionId(other.connectionId),
          x: previous?.x ?? target.x,
          y: previous?.y ?? target.y,
          targetX: target.x,
          targetY: target.y,
        };
      });

    setSmoothed(next);
  }, [others]);

  return {
    status,
    myPresence,
    others: smoothed,
    publishPointer,
    clearPointer: () => updateMyPresence({ cursor: null }),
  };
}
