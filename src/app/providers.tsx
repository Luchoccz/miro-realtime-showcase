"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { makeQueryClient } from "@/shared/lib/query/query-client";
import { LocalRealtimeProvider } from "@/shared/realtime/local-realtime-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

const DEFAULT_ROOM_ID = "showcase-board";

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => makeQueryClient());
  const roomId = process.env.NEXT_PUBLIC_BOARD_ROOM_ID?.trim() || DEFAULT_ROOM_ID;

  return (
    <LocalRealtimeProvider roomId={roomId}>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    </LocalRealtimeProvider>
  );
}
