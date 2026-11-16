import Link from "next/link";
import { cn } from "@/lib/cn";
import { ABAS, type Aba } from "@/components/cliente/utilidades";

export function AbasSolicitacoes({ ativa, contagem }: { ativa: Aba; contagem: Record<Aba, number> }) {
  return (
    <nav aria-label="Filtrar solicitações" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" className="inline-flex min-w-full gap-1 rounded-2xl bg-slate-100 p-1 sm:min-w-0">
        {ABAS.map((aba) => {
          const selecionada = aba.id === ativa;
          return (
            <Link
              key={aba.id}
              role="tab"
              aria-selected={selecionada}
              href={aba.id === "todas" ? "/cliente/solicitacoes" : `/cliente/solicitacoes?aba=${aba.id}`}
              scroll={false}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                selecionada ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-800",
              )}
            >
              {aba.rotulo}
              <span
                className={cn(
                  "grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] leading-5",
                  selecionada ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600",
                )}
              >
                {contagem[aba.id]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
