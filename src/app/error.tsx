"use client";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-zinc-100">
      <div className="max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900/90 p-6">
        <h1 className="text-xl font-semibold">Se produjo un error en la pizarra</h1>
        <p className="mt-2 text-sm text-zinc-300">
          {error.message || "Conexion inestable o estado inconsistente detectado."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
