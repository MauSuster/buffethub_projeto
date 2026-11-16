import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { dataLocal } from "@/components/cliente/utilidades";
import type { Negociacao } from "@/lib/database.types";

type Etapa = { rotulo: string; quando: string | null; feita: boolean };

function etapasDoContrato(n: Negociacao): Etapa[] {
  const s = n.status_contrato;
  const assinado = s === "Assinado" || s === "Pago" || s === "Concluído";
  const pago = s === "Pago" || s === "Concluído";
  return [
    { rotulo: "Proposta aceita", quando: n.contrato_criado_em, feita: true },
    { rotulo: "Contrato gerado", quando: n.contrato_criado_em, feita: true },
    { rotulo: "Assinado", quando: n.data_assinatura, feita: assinado },
    { rotulo: "Pago", quando: n.data_pagamento, feita: pago },
    { rotulo: "Concluído", quando: n.data_evento, feita: s === "Concluído" },
  ];
}

/** Linha do tempo do contrato: Proposta aceita → Contrato gerado → Assinado → Pago → Concluído. */
export function LinhaDoTempo({ n }: { n: Negociacao }) {
  const etapas = etapasDoContrato(n);
  const atual = etapas.findIndex((e) => !e.feita);
  return (
    <ol className="grid gap-3 sm:grid-cols-5 sm:gap-0">
      {etapas.map((etapa, i) => {
        const ehAtual = i === atual;
        return (
          <li key={etapa.rotulo} className="relative flex items-center gap-3 sm:flex-col sm:gap-2 sm:text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-4 right-1/2 hidden h-0.5 w-full sm:block",
                  etapa.feita ? "bg-brand-500" : "bg-slate-200",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ring-4 ring-white",
                etapa.feita && "bg-brand-600 text-white",
                ehAtual && "bg-accent-400 text-brand-950",
                !etapa.feita && !ehAtual && "bg-slate-100 text-slate-400",
              )}
            >
              {etapa.feita ? <Check className="size-4" /> : i + 1}
            </span>
            <div>
              <p className={cn("text-sm font-semibold", etapa.feita || ehAtual ? "text-slate-800" : "text-slate-400")}>{etapa.rotulo}</p>
              <p className="text-xs text-slate-500">
                {etapa.feita && etapa.quando ? dataLocal(etapa.quando) : ehAtual ? "Próxima etapa" : " "}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
