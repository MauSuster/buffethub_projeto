import { cn } from "@/lib/cn";

/** Altura da caixa de mensagens: ocupa a tela toda, descontando cabeçalho, menu do painel e título. */
export function classesCaixa(aberta: boolean) {
  return cn(
    "card grid min-h-[26rem] grid-rows-[minmax(0,1fr)] overflow-hidden md:grid-cols-[18rem_minmax(0,1fr)] lg:grid-cols-[20rem_minmax(0,1fr)]",
    aberta ? "h-[calc(100dvh-11.5rem)]" : "h-[calc(100dvh-16.5rem)]",
    "md:h-[calc(100dvh-16.75rem)] lg:h-[calc(100dvh-14.5rem)]",
  );
}

const BOLHAS = [
  { minha: false, largura: "w-2/3" },
  { minha: false, largura: "w-1/3" },
  { minha: true, largura: "w-1/2" },
  { minha: false, largura: "w-3/5" },
  { minha: true, largura: "w-2/5" },
];

export function EsqueletoMensagens({ aberta }: { aberta: boolean }) {
  return (
    <div className={classesCaixa(aberta)} aria-busy="true" aria-label="Carregando mensagens">
      <div className={cn("flex flex-col border-slate-100 md:border-r", aberta && "max-md:hidden")}>
        <div className="space-y-3 border-b border-slate-100 p-4">
          <div className="h-5 w-28 animate-pulse rounded-md bg-slate-200/70" />
          <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div className="space-y-1 p-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
              <div className="size-11 shrink-0 animate-pulse rounded-full bg-slate-200/70" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/5 animate-pulse rounded bg-slate-200/70" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={cn("flex flex-col", !aberta && "max-md:hidden")}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <div className="size-10 animate-pulse rounded-full bg-slate-200/70" />
          <div className="space-y-2">
            <div className="h-3.5 w-36 animate-pulse rounded bg-slate-200/70" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-3 bg-slate-50/70 p-5">
          {BOLHAS.map((b, i) => (
            <div key={i} className={cn("flex", b.minha ? "justify-end" : "justify-start")}>
              <div className={cn("h-10 animate-pulse rounded-2xl", b.largura, b.minha ? "bg-brand-100" : "bg-slate-200/70")} />
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 p-3">
          <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
