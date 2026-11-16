import { Alerta } from "@/components/ui/basicos";
import { cn } from "@/lib/cn";

function Bloco({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-200/70", className)} />;
}

export function ErroCarregamento({ mensagem }: { mensagem: string }) {
  return (
    <Alerta tipo="erro" titulo="Não foi possível carregar esta tela">
      {mensagem} Atualize a página para tentar de novo.
    </Alerta>
  );
}

export function EsqueletoInicio() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando">
      <Bloco className="h-44 rounded-[var(--radius-card)]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Bloco key={i} className="h-32 rounded-[var(--radius-card)]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Bloco className="h-72 rounded-[var(--radius-card)]" />
        <Bloco className="h-72 rounded-[var(--radius-card)]" />
      </div>
    </div>
  );
}

export function EsqueletoFormulario() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card space-y-4 p-6">
          <Bloco className="h-5 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Bloco className="h-11" />
            <Bloco className="h-11" />
          </div>
          <Bloco className="h-24" />
        </div>
      ))}
    </div>
  );
}

export function EsqueletoCartoes() {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Carregando">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card space-y-4 p-6">
          <Bloco className="h-5 w-40" />
          <Bloco className="h-8 w-32" />
          <Bloco className="h-16" />
          <Bloco className="h-8 w-56" />
        </div>
      ))}
    </div>
  );
}

export function EsqueletoCalendario() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]" aria-busy="true" aria-label="Carregando">
      <div className="card space-y-4 p-4 sm:p-6">
        <Bloco className="h-8 w-56" />
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 35 }, (_, i) => (
            <Bloco key={i} className="aspect-square sm:aspect-auto sm:h-24" />
          ))}
        </div>
      </div>
      <Bloco className="h-80 rounded-[var(--radius-card)]" />
    </div>
  );
}

export function EsqueletoSolicitacoes() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Carregando">
      <Bloco className="h-11 w-full max-w-lg" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Bloco key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Bloco className="h-[32rem] rounded-[var(--radius-card)]" />
      </div>
    </div>
  );
}
