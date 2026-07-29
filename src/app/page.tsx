import { BoardCanvas } from "@/modules/board/presentation/components/board-canvas";
import { Providers } from "./providers";

export default function Home() {
  return (
    <Providers>
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 md:p-6">
        <header className="relative overflow-hidden rounded-3xl border border-zinc-900/20 bg-zinc-950 px-6 py-6 text-zinc-50 shadow-xl md:px-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -bottom-20 left-16 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl" />
          <p className="relative text-xs uppercase tracking-[0.25em] text-zinc-300">Portfolio Showcase</p>
          <h1 className="relative mt-2 text-2xl font-bold leading-tight md:text-4xl">
            Pizarra colaborativa en tiempo real
          </h1>
          <p className="relative mt-3 max-w-3xl text-sm text-zinc-300 md:text-base">
            Frontend-only MVP: optimistic updates con TanStack Query, presencia en vivo con smoothing y sincronizacion local usando BroadcastChannel y localStorage.
          </p>
        </header>

        <BoardCanvas />
      </main>
    </Providers>
  );
}
