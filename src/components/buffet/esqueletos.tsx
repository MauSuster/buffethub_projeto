import { cn } from "@/lib/cn";

function Bloco({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-200/70", className)} />;
}

export function EsqueletoPerfil() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:pt-8" aria-busy="true" aria-label="Carregando perfil do buffet">
      <Bloco className="h-4 w-36" />
      <div className="mb-6 mt-5 space-y-3">
        <div className="flex gap-2">
          <Bloco className="h-5 w-20 rounded-full" />
          <Bloco className="h-5 w-24 rounded-full" />
        </div>
        <Bloco className="h-9 w-2/3 max-w-md" />
        <Bloco className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="space-y-6">
          <Bloco className="aspect-[16/9] w-full rounded-[var(--radius-card)]" />
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Bloco key={i} className="aspect-[4/3]" />
            ))}
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="card space-y-3 p-7">
              <Bloco className="h-6 w-48" />
              <Bloco className="h-4 w-full" />
              <Bloco className="h-4 w-5/6" />
              <Bloco className="h-4 w-2/3" />
            </div>
          ))}
        </div>
        <div className="card hidden h-fit space-y-4 p-6 lg:block">
          <Bloco className="h-9 w-3/4" />
          <Bloco className="h-4 w-1/2" />
          <div className="grid grid-cols-2 gap-3">
            <Bloco className="h-16" />
            <Bloco className="h-16" />
          </div>
          <Bloco className="h-12 w-full" />
          <Bloco className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

export function EsqueletoOrcamento() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Carregando formulário de orçamento">
      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="card h-fit overflow-hidden">
          <Bloco className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Bloco className="h-6 w-3/4" />
            <Bloco className="h-4 w-1/2" />
            <Bloco className="h-4 w-2/3" />
          </div>
        </div>
        <div className="space-y-6">
          <Bloco className="h-9 w-64" />
          <div className="card space-y-5 p-7">
            <Bloco className="h-6 w-48" />
            <div className="grid gap-5 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Bloco className="h-4 w-24" />
                  <Bloco className="h-11 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="card space-y-4 p-7">
            <Bloco className="h-6 w-56" />
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Bloco key={i} className="h-24" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
