"use client";

import { useRef, useState } from "react";
import { Grip, Trash2 } from "lucide-react";
import type { BoardElement } from "@/modules/board/domain/entities/board-element";
import { useBoardElements } from "@/modules/board/presentation/hooks/use-board-elements";
import { usePresence } from "@/modules/board/presentation/hooks/use-presence";
import { PresenceLayer } from "./presence-layer";
import { Toolbar } from "./toolbar";

interface DragState {
  elementId: string;
  offsetX: number;
  offsetY: number;
}

interface ResizeState {
  elementId: string;
  originX: number;
  originY: number;
  startWidth: number;
  startHeight: number;
}

const MIN_NOTE_WIDTH = 180;
const MIN_NOTE_HEIGHT = 120;

export function BoardCanvas() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { elements, addSticky, moveSticky, updateSticky, removeSticky, isMutating } = useBoardElements();
  const { others, status, publishPointer, clearPointer } = usePresence();
  const [drag, setDrag] = useState<DragState | null>(null);
  const [resize, setResize] = useState<ResizeState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");

  const editingElement = editingId ? elements.find((element) => element.id === editingId) : undefined;

  const onMouseDown = (event: React.MouseEvent, element: BoardElement) => {
    if (editingId || resize) {
      return;
    }

    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    setDrag({
      elementId: element.id,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    });
  };

  const onMouseMove = (event: React.MouseEvent) => {
    const rootRect = rootRef.current?.getBoundingClientRect();
    if (rootRect) {
      publishPointer(event.clientX - rootRect.left, event.clientY - rootRect.top);
    }

    if (resize) {
      const nextWidth = Math.max(MIN_NOTE_WIDTH, resize.startWidth + (event.clientX - resize.originX));
      const nextHeight = Math.max(MIN_NOTE_HEIGHT, resize.startHeight + (event.clientY - resize.originY));

      updateSticky(resize.elementId, {
        size: {
          width: nextWidth,
          height: nextHeight,
        },
      });
      return;
    }

    if (!drag || !rootRect) {
      return;
    }

    moveSticky(drag.elementId, {
      x: event.clientX - rootRect.left - drag.offsetX,
      y: event.clientY - rootRect.top - drag.offsetY,
    });
  };

  const stopInteractions = () => {
    setDrag(null);
    setResize(null);
  };

  const startEditing = (element: BoardElement) => {
    setEditingId(element.id);
    setDraftContent(element.content);
    stopInteractions();
  };

  const commitEditing = () => {
    if (!editingId || !editingElement) {
      setEditingId(null);
      setDraftContent("");
      return;
    }

    if (draftContent !== editingElement.content) {
      updateSticky(editingId, { content: draftContent });
    }

    setEditingId(null);
    setDraftContent("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftContent("");
  };

  return (
    <section className="relative flex h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-3xl border border-zinc-900/15 bg-white/85 shadow-2xl shadow-zinc-900/10 backdrop-blur"
      onMouseMove={onMouseMove}
      onMouseUp={stopInteractions}
      onMouseLeave={() => {
        stopInteractions();
        clearPointer();
      }}
      ref={rootRef}
    >
      <div className="absolute left-5 top-5 z-30">
        <Toolbar onCreateSticky={addSticky} isMutating={isMutating} />
      </div>

      <div className="absolute right-5 top-5 z-30 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
        Sync: {status}
      </div>

      <div className="relative h-full w-full bg-[radial-gradient(circle_at_center,rgba(24,24,27,0.05)_1px,transparent_1px)] [background-size:22px_22px]">
        {elements.map((element) => (
          <div
            key={element.id}
            onDoubleClick={() => startEditing(element)}
            onMouseDown={(event) => onMouseDown(event, element)}
            className="absolute rounded-2xl border border-amber-900/10 bg-amber-200 p-3 text-sm font-medium text-zinc-900 shadow-md transition hover:shadow-lg"
            style={{
              transform: `translate(${element.position.x}px, ${element.position.y}px)`,
              width: element.size.width,
              minHeight: element.size.height,
              zIndex: element.zIndex,
            }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-600">Sticky</span>
              <button
                type="button"
                aria-label="Eliminar nota"
                className="rounded-lg p-1 text-zinc-500 transition hover:bg-black/10 hover:text-zinc-900"
                onClick={(event) => {
                  event.stopPropagation();
                  if (editingId === element.id) {
                    cancelEditing();
                  }
                  removeSticky(element.id);
                }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                }}
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            {editingId === element.id ? (
              <textarea
                autoFocus
                value={draftContent}
                onBlur={commitEditing}
                onChange={(event) => setDraftContent(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelEditing();
                  }

                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    commitEditing();
                  }
                }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                }}
                className="min-h-24 w-full resize-none border-none bg-transparent text-sm font-medium text-zinc-900 outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => startEditing(element)}
                onMouseDown={(event) => onMouseDown(event, element)}
                className="block min-h-24 w-full cursor-grab whitespace-pre-wrap text-left active:cursor-grabbing"
              >
                {element.content}
              </button>
            )}

            <button
              type="button"
              aria-label="Redimensionar nota"
              className="absolute bottom-2 right-2 rounded-md p-1 text-zinc-500 transition hover:bg-black/10 hover:text-zinc-900"
              onMouseDown={(event) => {
                event.stopPropagation();
                setResize({
                  elementId: element.id,
                  originX: event.clientX,
                  originY: event.clientY,
                  startWidth: element.size.width,
                  startHeight: element.size.height,
                });
                setDrag(null);
              }}
            >
              <Grip className="size-4" />
            </button>
          </div>
        ))}

        <PresenceLayer cursors={others} />
      </div>
    </section>
  );
}
