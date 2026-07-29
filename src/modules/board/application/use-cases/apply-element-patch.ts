import type { BoardElement, Point } from "@/modules/board/domain/entities/board-element";

export function upsertElement(elements: BoardElement[], next: BoardElement): BoardElement[] {
  const index = elements.findIndex((item) => item.id === next.id);

  if (index === -1) {
    return [...elements, next].sort((a, b) => a.zIndex - b.zIndex);
  }

  const candidate = elements[index];
  if (candidate.updatedAt > next.updatedAt) {
    return elements;
  }

  const copy = [...elements];
  copy[index] = next;
  return copy;
}

export function moveElement(
  elements: BoardElement[],
  payload: { elementId: string; position: Point; updatedAt: number },
): BoardElement[] {
  return elements.map((item) => {
    if (item.id !== payload.elementId) {
      return item;
    }

    if (item.updatedAt > payload.updatedAt) {
      return item;
    }

    return {
      ...item,
      position: payload.position,
      updatedAt: payload.updatedAt,
    };
  });
}

export function removeElement(
  elements: BoardElement[],
  payload: { elementId: string; updatedAt: number },
): BoardElement[] {
  const current = elements.find((item) => item.id === payload.elementId);

  if (!current) {
    return elements;
  }

  if (current.updatedAt > payload.updatedAt) {
    return elements;
  }

  return elements.filter((item) => item.id !== payload.elementId);
}
