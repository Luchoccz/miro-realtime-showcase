"use client";

import { useEffect, useMemo } from "react";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  DEFAULT_STICKY_SIZE,
  type BoardElement,
  type Point,
} from "@/modules/board/domain/entities/board-element";
import { moveElement, removeElement, upsertElement } from "@/modules/board/application/use-cases/apply-element-patch";
import type { BoardRealtimeEvent } from "@/shared/realtime/board-realtime";
import { useLocalRealtime } from "@/shared/realtime/local-realtime-provider";

const BOARD_QUERY_KEY = ["board-elements", "main-room"] as const;
const BOARD_STORAGE_KEY = "showcase-board-elements";

function randomNote(): BoardElement {
  const now = Date.now();
  const id = `note-${Math.random().toString(36).slice(2, 10)}`;

  return {
    id,
    kind: "sticky",
    content: "Nueva idea",
    position: {
      x: 160 + Math.floor(Math.random() * 280),
      y: 140 + Math.floor(Math.random() * 200),
    },
    size: { ...DEFAULT_STICKY_SIZE },
    zIndex: now,
    updatedAt: now,
  };
}

function setElements(queryClient: QueryClient, updater: (prev: BoardElement[]) => BoardElement[]): void {
  queryClient.setQueryData<BoardElement[]>(BOARD_QUERY_KEY, (prev) => {
    const next = updater(prev ?? []);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(next));
    }

    return next;
  });
}

function readStoredElements(): BoardElement[] {
  const raw = window.localStorage.getItem(BOARD_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as BoardElement[];
  } catch {
    return [];
  }
}

function findElement(elements: BoardElement[], elementId: string): BoardElement | undefined {
  return elements.find((item) => item.id === elementId);
}

export function useBoardElements() {
  const queryClient = useQueryClient();
  const { actorId, publishEvent, subscribe } = useLocalRealtime();

  const query = useQuery({
    queryKey: BOARD_QUERY_KEY,
    queryFn: async () => [] as BoardElement[],
    initialData: [] as BoardElement[],
  });

  useEffect(() => {
    const stored = readStoredElements();
    queryClient.setQueryData(BOARD_QUERY_KEY, stored);
  }, [queryClient]);

  useEffect(() => {
    return subscribe((event) => {
      if (event.payload.actorId === actorId) {
        return;
      }

      if (event.type === "board.element.upsert") {
        setElements(queryClient, (prev) => upsertElement(prev, event.payload.element));
        return;
      }

      if (event.type === "board.element.move") {
        setElements(queryClient, (prev) => moveElement(prev, event.payload));
        return;
      }

      if (event.type === "board.element.delete") {
        setElements(queryClient, (prev) => removeElement(prev, event.payload));
      }
    });
  }, [actorId, queryClient, subscribe]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== BOARD_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        queryClient.setQueryData(BOARD_QUERY_KEY, JSON.parse(event.newValue) as BoardElement[]);
      } catch {
        queryClient.setQueryData(BOARD_QUERY_KEY, [] as BoardElement[]);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [queryClient]);

  const createStickyMutation = useMutation({
    mutationKey: ["mutation", "create-sticky"],
    mutationFn: async (element: BoardElement) => {
      const mutationId = `mut-${Math.random().toString(36).slice(2, 10)}`;
      const outgoing: BoardRealtimeEvent = {
        type: "board.element.upsert",
        payload: {
          actorId,
          mutationId,
          element,
        },
      };
      publishEvent(outgoing);
      return element;
    },
    onMutate: async (element) => {
      await queryClient.cancelQueries({ queryKey: BOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<BoardElement[]>(BOARD_QUERY_KEY) ?? [];
      setElements(queryClient, (prev) => upsertElement(prev, element));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(BOARD_QUERY_KEY, context?.previous ?? []);
    },
  });

  const moveStickyMutation = useMutation({
    mutationKey: ["mutation", "move-sticky"],
    mutationFn: async (variables: { elementId: string; position: Point }) => {
      const mutationId = `mut-${Math.random().toString(36).slice(2, 10)}`;
      const updatedAt = Date.now();
      const outgoing: BoardRealtimeEvent = {
        type: "board.element.move",
        payload: {
          actorId,
          mutationId,
          elementId: variables.elementId,
          position: variables.position,
          updatedAt,
        },
      };
      publishEvent(outgoing);
      return { ...variables, updatedAt };
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: BOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<BoardElement[]>(BOARD_QUERY_KEY) ?? [];
      const patch = {
        elementId: variables.elementId,
        position: variables.position,
        updatedAt: Date.now(),
      };
      setElements(queryClient, (prev) => moveElement(prev, patch));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(BOARD_QUERY_KEY, context?.previous ?? []);
    },
    onSuccess: (result) => {
      setElements(queryClient, (prev) => moveElement(prev, result));
    },
  });

  const updateStickyMutation = useMutation({
    mutationKey: ["mutation", "update-sticky"],
    mutationFn: async (variables: {
      elementId: string;
      patch: Partial<Pick<BoardElement, "content" | "size" | "position">>;
    }) => {
      const current = findElement(
        queryClient.getQueryData<BoardElement[]>(BOARD_QUERY_KEY) ?? [],
        variables.elementId,
      );

      if (!current) {
        return null;
      }

      const mutationId = `mut-${Math.random().toString(36).slice(2, 10)}`;
      const updatedAt = Date.now();
      const nextElement: BoardElement = {
        ...current,
        ...variables.patch,
        size: variables.patch.size ?? current.size,
        position: variables.patch.position ?? current.position,
        updatedAt,
      };

      const outgoing: BoardRealtimeEvent = {
        type: "board.element.upsert",
        payload: {
          actorId,
          mutationId,
          element: nextElement,
        },
      };

      publishEvent(outgoing);
      return nextElement;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: BOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<BoardElement[]>(BOARD_QUERY_KEY) ?? [];
      const current = findElement(previous, variables.elementId);

      if (!current) {
        return { previous };
      }

      const optimistic: BoardElement = {
        ...current,
        ...variables.patch,
        size: variables.patch.size ?? current.size,
        position: variables.patch.position ?? current.position,
        updatedAt: Date.now(),
      };

      setElements(queryClient, (prev) => upsertElement(prev, optimistic));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(BOARD_QUERY_KEY, context?.previous ?? []);
    },
    onSuccess: (result) => {
      if (!result) {
        return;
      }

      setElements(queryClient, (prev) => upsertElement(prev, result));
    },
  });

  const removeStickyMutation = useMutation({
    mutationKey: ["mutation", "remove-sticky"],
    mutationFn: async (elementId: string) => {
      const mutationId = `mut-${Math.random().toString(36).slice(2, 10)}`;
      const updatedAt = Date.now();
      const outgoing: BoardRealtimeEvent = {
        type: "board.element.delete",
        payload: {
          actorId,
          mutationId,
          elementId,
          updatedAt,
        },
      };

      publishEvent(outgoing);
      return { elementId, updatedAt };
    },
    onMutate: async (elementId) => {
      await queryClient.cancelQueries({ queryKey: BOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<BoardElement[]>(BOARD_QUERY_KEY) ?? [];
      setElements(queryClient, (prev) => removeElement(prev, { elementId, updatedAt: Date.now() }));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(BOARD_QUERY_KEY, context?.previous ?? []);
    },
    onSuccess: (result) => {
      setElements(queryClient, (prev) => removeElement(prev, result));
    },
  });

  const actions = useMemo(
    () => ({
      addSticky: () => {
        createStickyMutation.mutate(randomNote());
      },
      moveSticky: (elementId: string, position: Point) => {
        moveStickyMutation.mutate({ elementId, position });
      },
      updateSticky: (
        elementId: string,
        patch: Partial<Pick<BoardElement, "content" | "size" | "position">>,
      ) => {
        updateStickyMutation.mutate({ elementId, patch });
      },
      removeSticky: (elementId: string) => {
        removeStickyMutation.mutate(elementId);
      },
    }),
    [createStickyMutation, moveStickyMutation, removeStickyMutation, updateStickyMutation],
  );

  return {
    elements: query.data,
    isMutating:
      createStickyMutation.isPending ||
      moveStickyMutation.isPending ||
      updateStickyMutation.isPending ||
      removeStickyMutation.isPending,
    ...actions,
  };
}
