"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocalActorId } from "@/modules/board/presentation/hooks/use-local-actor-id";
import {
  DEFAULT_PRESENCE,
  type BoardPresence,
  type BoardRealtimeEvent,
  type RemotePresence,
} from "./board-realtime";

const DEFAULT_ROOM_ID = "showcase-board";
const HEARTBEAT_MS = 1500;
const STALE_PRESENCE_MS = 4500;

type ConnectionStatus = "local-only" | "tab-sync";

type RealtimeEnvelope =
  | {
      type: "board-event";
      senderConnectionId: number;
      event: BoardRealtimeEvent;
    }
  | {
      type: "presence-sync";
      senderConnectionId: number;
      actorId: string;
      presence: BoardPresence;
    }
  | {
      type: "presence-leave";
      senderConnectionId: number;
    };

interface LocalRealtimeContextValue {
  actorId: string;
  myPresence: BoardPresence;
  others: RemotePresence[];
  status: ConnectionStatus;
  publishEvent: (event: BoardRealtimeEvent) => void;
  subscribe: (listener: (event: BoardRealtimeEvent) => void) => () => void;
  updateMyPresence: (patch: Partial<BoardPresence>) => void;
}

interface LocalRealtimeProviderProps {
  children: React.ReactNode;
  roomId?: string;
}

interface PresenceEntry extends RemotePresence {
  lastSeen: number;
}

const LocalRealtimeContext = createContext<LocalRealtimeContextValue | null>(null);

function createConnectionId(): number {
  return Math.floor(Math.random() * 1000000000);
}

function safelyPostMessage(channel: BroadcastChannel, message: RealtimeEnvelope): void {
  try {
    channel.postMessage(message);
  } catch {
    // Ignore sends against a channel that has already been closed during teardown.
  }
}

export function LocalRealtimeProvider({
  children,
  roomId = DEFAULT_ROOM_ID,
}: LocalRealtimeProviderProps) {
  const actorId = useLocalActorId();
  const connectionIdRef = useRef<number>(createConnectionId());
  const listenersRef = useRef(new Set<(event: BoardRealtimeEvent) => void>());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [myPresence, setMyPresence] = useState<BoardPresence>(DEFAULT_PRESENCE);
  const [othersMap, setOthersMap] = useState<Record<number, PresenceEntry>>({});
  const [status, setStatus] = useState<ConnectionStatus>("local-only");

  const channelName = useMemo(() => `miro-showcase:${roomId}`, [roomId]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") {
      return;
    }

    const channel = new window.BroadcastChannel(channelName);
    channelRef.current = channel;
    const connectionId = connectionIdRef.current;
    const syncStatusFrame = window.requestAnimationFrame(() => {
      setStatus("tab-sync");
    });

    channel.onmessage = (messageEvent: MessageEvent<RealtimeEnvelope>) => {
      const envelope = messageEvent.data;

      if (!envelope || envelope.senderConnectionId === connectionId) {
        return;
      }

      if (envelope.type === "board-event") {
        listenersRef.current.forEach((listener) => listener(envelope.event));
        return;
      }

      if (envelope.type === "presence-sync") {
        setOthersMap((prev) => ({
          ...prev,
          [envelope.senderConnectionId]: {
            actorId: envelope.actorId,
            connectionId: envelope.senderConnectionId,
            presence: envelope.presence,
            lastSeen: Date.now(),
          },
        }));
        return;
      }

      setOthersMap((prev) => {
        const next = { ...prev };
        delete next[envelope.senderConnectionId];
        return next;
      });
    };

    return () => {
      window.cancelAnimationFrame(syncStatusFrame);
      safelyPostMessage(channel, {
        type: "presence-leave",
        senderConnectionId: connectionId,
      });

      if (channelRef.current === channel) {
        channelRef.current = null;
      }

      setStatus("local-only");

      channel.close();
    };
  }, [channelName]);

  useEffect(() => {
    const channel = channelRef.current;

    if (!channel) {
      return;
    }

    const connectionId = connectionIdRef.current;

    const syncPresence = () => {
      safelyPostMessage(channel, {
        type: "presence-sync",
        senderConnectionId: connectionId,
        actorId,
        presence: myPresence,
      } satisfies RealtimeEnvelope);
    };

    syncPresence();
    const heartbeatId = window.setInterval(syncPresence, HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeatId);
    };
  }, [actorId, channelName, myPresence]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const cutoff = Date.now() - STALE_PRESENCE_MS;
      setOthersMap((prev) => {
        const activeEntries = Object.entries(prev).filter(([, entry]) => entry.lastSeen >= cutoff);
        return Object.fromEntries(activeEntries);
      });
    }, HEARTBEAT_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const value = useMemo<LocalRealtimeContextValue>(
    () => ({
      actorId,
      myPresence,
      others: Object.values(othersMap).map((entry) => ({
        actorId: entry.actorId,
        connectionId: entry.connectionId,
        presence: entry.presence,
      })),
      status,
      publishEvent: (event) => {
        listenersRef.current.forEach((listener) => listener(event));
        const channel = channelRef.current;
        if (channel) {
          safelyPostMessage(channel, {
            type: "board-event",
            senderConnectionId: connectionIdRef.current,
            event,
          } satisfies RealtimeEnvelope);
        }
      },
      subscribe: (listener) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
      updateMyPresence: (patch) => {
        setMyPresence((prev) => ({ ...prev, ...patch }));
      },
    }),
    [actorId, myPresence, othersMap, status],
  );

  return <LocalRealtimeContext.Provider value={value}>{children}</LocalRealtimeContext.Provider>;
}

export function useLocalRealtime(): LocalRealtimeContextValue {
  const context = useContext(LocalRealtimeContext);

  if (!context) {
    throw new Error("useLocalRealtime debe usarse dentro de LocalRealtimeProvider");
  }

  return context;
}