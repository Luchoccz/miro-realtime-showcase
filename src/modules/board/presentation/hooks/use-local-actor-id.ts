"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "showcase-actor-id";
const SERVER_ACTOR_ID = "actor-pending";

function generateId(): string {
  return `actor-${Math.random().toString(36).slice(2, 10)}`;
}

function subscribe(): () => void {
  return () => {};
}

function getServerSnapshot(): string {
  return SERVER_ACTOR_ID;
}

function getSnapshot(): string {
  const existing = window.sessionStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const next = generateId();
  window.sessionStorage.setItem(STORAGE_KEY, next);
  return next;
}

export function useLocalActorId(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
