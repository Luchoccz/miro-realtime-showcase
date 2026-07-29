import { describe, expect, it } from "vitest";
import { moveElement, removeElement, upsertElement } from "@/modules/board/application/use-cases/apply-element-patch";
import type { BoardElement } from "@/modules/board/domain/entities/board-element";

function buildElement(overrides: Partial<BoardElement> = {}): BoardElement {
  return {
    id: "el-1",
    kind: "sticky",
    content: "item",
    position: { x: 100, y: 100 },
    size: { width: 200, height: 150 },
    zIndex: 1,
    updatedAt: 1000,
    ...overrides,
  };
}

describe("apply-element-patch", () => {
  it("upsertElement agrega elemento nuevo", () => {
    const result = upsertElement([], buildElement());
    expect(result).toHaveLength(1);
  });

  it("upsertElement ignora versiones antiguas", () => {
    const current = buildElement({ updatedAt: 3000, content: "nuevo" });
    const stale = buildElement({ updatedAt: 2000, content: "viejo" });
    const result = upsertElement([current], stale);
    expect(result[0]?.content).toBe("nuevo");
  });

  it("moveElement aplica posicion cuando el evento es mas nuevo", () => {
    const current = buildElement({ updatedAt: 2000 });
    const result = moveElement([current], {
      elementId: current.id,
      position: { x: 240, y: 320 },
      updatedAt: 3000,
    });

    expect(result[0]?.position).toEqual({ x: 240, y: 320 });
  });

  it("removeElement elimina un elemento cuando el evento es mas nuevo", () => {
    const current = buildElement({ updatedAt: 2000 });
    const result = removeElement([current], {
      elementId: current.id,
      updatedAt: 3000,
    });

    expect(result).toHaveLength(0);
  });
});
