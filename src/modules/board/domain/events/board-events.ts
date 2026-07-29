import type { BoardElement, Point } from "../entities/board-element";

export type BoardRealtimeEvent =
  | {
      type: "board.element.upsert";
      payload: {
        actorId: string;
        mutationId: string;
        element: BoardElement;
      };
    }
  | {
      type: "board.element.move";
      payload: {
        actorId: string;
        mutationId: string;
        elementId: string;
        position: Point;
        updatedAt: number;
      };
    };
