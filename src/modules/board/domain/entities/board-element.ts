export type BoardElementKind = "sticky" | "text";

export interface Point {
  x: number;
  y: number;
}

export interface BoardElement {
  id: string;
  kind: BoardElementKind;
  content: string;
  position: Point;
  size: {
    width: number;
    height: number;
  };
  zIndex: number;
  updatedAt: number;
}

export const DEFAULT_STICKY_SIZE = {
  width: 220,
  height: 180,
} as const;
