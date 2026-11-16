"use client";

import { Scale, X } from "lucide-react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { Foto } from "@/components/ui/basicos";
import { limparComparacao, removerDaComparacao, useComparacao } from "@/components/busca/comparacao-store";
import { MAX_COMPARAR, MIN_COMPARAR } from "@/components/busca/parametros";

/** Barra flutuante com os buffets marcados para comparar (UC06, passo a). */
export function BarraComparacao() {
  const { itens } = useComparacao();
  const total = itens.length;
  if (total === 0) return null;

  const pode = total >= MIN_COMPARAR;
  const vagas = Array.from({ length: MAX_COMPARAR - total });
  const dica =
    total < MIN_COMPARAR
      ? "Marque mais 1 buffet para comparar"
      : total === MAX_COMPARAR
        ? "Limite de 4 buffets atingido"
        : `Marque de ${MIN_COMPARAR} a ${MAX_COMPARAR} buffets para comparar`;

  return (
    <>
      <div aria-hidden className="h-28" />
      <div className="fixed inset-x-0 bottom-3 z-30 px-3 sm:bottom-5 sm:px-6">
        <div
          role="region"
          aria-label="Buffets marcados para comparar"
          className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl border border-slate-200 border-l-4 border-l-accent-400 bg-white/95 p-3 shadow-lift backdrop-blur transition duration-300 starting:translate-y-6 starting:opacity-0 sm:gap-5 sm:pl-5"
        >
          <div className="min-w-0 flex-1 sm:flex-none">
            <p className="font-bold text-slate-900">
              {total} {total === 1 ? "buffet marcado" : "buffets marcados"}
            </p>
            <p className="truncate text-xs text-slate-500">{dica}</p>
          </div>

          <ul className="hidden flex-1 items-center gap-2 sm:flex">
            {itens.map((item) => (
              <li key={item.id} className="group relative">
                <Foto
                  src={item.capa_url}
                  alt={item.nome}
                  className="size-12 rounded-xl ring-2 ring-white shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => removerDaComparacao(item.id)}
                  aria-label={`Tirar ${item.nome} da comparação`}
                  title={`Tirar ${item.nome}`}
                  className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-slate-800 text-white shadow transition hover:bg-red-600"
                >
                  <X className="size-3" strokeWidth={3} />
                </button>
              </li>
            ))}
            {vagas.map((_, i) => (
              <li key={i} aria-hidden className="size-12 rounded-xl border-2 border-dashed border-slate-200" />
            ))}
          </ul>

          <Botao variante="fantasma" tamanho="sm" onClick={limparComparacao} className="hidden sm:inline-flex">
            Limpar
          </Botao>
          {pode ? (
            <BotaoLink href={`/comparar?ids=${itens.map((i) => i.id).join(",")}`} variante="destaque" className="shrink-0">
              <Scale className="size-4" /> Comparar ({total})
            </BotaoLink>
          ) : (
            <Botao variante="destaque" disabled className="shrink-0">
              <Scale className="size-4" /> Comparar ({total})
            </Botao>
          )}
          <button
            type="button"
            onClick={limparComparacao}
            aria-label="Limpar seleção"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 sm:hidden"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </>
  );
}
