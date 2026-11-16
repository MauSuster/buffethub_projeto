import { cn } from "@/lib/cn";

function Bloco({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200/70", className)} />;
}

/** Estado de carregamento das telas do cliente: título + lista de cards. */
export function EsqueletoLista({ itens = 3, comAbas = false }: { itens?: number; comAbas?: boolean }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando">
      <div className="space-y-2">
        <Bloco className="h-8 w-64" />
        <Bloco className="h-4 w-96 max-w-full" />
      </div>
      {comAbas && <Bloco className="h-11 w-full max-w-xl rounded-2xl" />}
      {Array.from({ length: itens }, (_, i) => (
        <div key={i} className="card flex flex-col gap-5 p-5 sm:flex-row">
          <Bloco className="h-32 w-full rounded-2xl sm:w-40" />
          <div className="flex-1 space-y-3">
            <Bloco className="h-5 w-48" />
            <Bloco className="h-4 w-full" />
            <Bloco className="h-4 w-2/3" />
            <Bloco className="h-9 w-40 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EsqueletoCheckout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Carregando">
      <Bloco className="mb-6 h-9 w-48" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="card space-y-4 p-6">
          <Bloco className="h-14 w-56" />
          {Array.from({ length: 6 }, (_, i) => (
            <Bloco key={i} className="h-4 w-full" />
          ))}
          <Bloco className="h-10 w-40" />
        </div>
        <div className="card space-y-4 p-6">
          <Bloco className="h-6 w-48" />
          <Bloco className="h-12 w-full rounded-2xl" />
          <Bloco className="h-40 w-full rounded-2xl" />
          <Bloco className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
