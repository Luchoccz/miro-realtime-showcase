import type { Point } from "@/modules/board/domain/entities/board-element";

export type BoardRealtimeEvent =
  | {
      type: "board.element.upsert";
      payload: {
        actorId: string;
        mutationId: string;
        element: {
          id: string;
          kind: "sticky" | "text";
          content: string;
          position: { x: number; y: number };
          size: { width: number; height: number };
          zIndex: number;
          updatedAt: number;
        };
      };
    }
  | {
      type: "board.element.move";
      payload: {
        actorId: string;
        mutationId: string;
        elementId: string;
        position: { x: number; y: number };
        updatedAt: number;
      };
    }
  | {
      type: "board.element.delete";
      payload: {
        actorId: string;
        mutationId: string;
        elementId: string;
        updatedAt: number;
      };
    };

export interface BoardPresence {
  cursor: Point | null;
  selection: string[];
  isTyping: boolean;
}

export interface RemotePresence {
  connectionId: number;
  actorId: string;
  presence: BoardPresence;
}

export const DEFAULT_PRESENCE: BoardPresence = {
  cursor: null,
  selection: [],
  isTyping: false,
};