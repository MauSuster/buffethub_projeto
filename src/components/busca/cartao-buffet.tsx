"use client";

import Link from "next/link";
import { Check, ChefHat, MapPin, Users } from "lucide-react";
import { Foto } from "@/components/ui/basicos";
import { alternarComparacao, useComparacao } from "@/components/busca/comparacao-store";
import { NotaBuffet, localizacao } from "@/components/busca/info-buffet";
import { MAX_COMPARAR } from "@/components/busca/parametros";
import { cn } from "@/lib/cn";
import { moeda } from "@/lib/formatos";
import type { BuffetBusca } from "@/lib/database.types";

const MAX_TIPOS_VISIVEIS = 3;

export function BotaoComparar({ buffet, className }: { buffet: BuffetBusca; className?: string }) {
  const { itens, cheia } = useComparacao();
  const marcado = itens.some((i) => i.id === buffet.id);
  const bloqueado = !marcado && cheia;
  return (
    <button
      type="button"
      aria-pressed={marcado}
      aria-label={`Comparar ${buffet.nome_fantasia}`}
      disabled={bloqueado}
      title={bloqueado ? `Você já marcou ${MAX_COMPARAR} buffets, o máximo para comparar.` : undefined}
      onClick={() => alternarComparacao({ id: buffet.id, nome: buffet.nome_fantasia, capa_url: buffet.capa_url })}
      className={cn(
        "relative z-10 inline-flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        marcado ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-5 place-items-center rounded-md border-2 transition",
          marcado ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white",
        )}
      >
        {marcado && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      {marcado ? "Na comparação" : "Comparar"}
    </button>
  );
}

type Props = {
  buffet: BuffetBusca;
  numero: number;
  destacado?: boolean;
  onDestacar?: (id: string | null) => void;
};

export function CartaoBuffet({ buffet: b, numero, destacado, onDestacar }: Props) {
  const tiposVisiveis = b.tipos_evento.slice(0, MAX_TIPOS_VISIVEIS);
  const tiposRestantes = b.tipos_evento.length - tiposVisiveis.length;

  return (
    <article
      onMouseEnter={() => onDestacar?.(b.id)}
      onMouseLeave={() => onDestacar?.(null)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border bg-white shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:flex-row",
        destacado ? "border-brand-300 ring-4 ring-brand-100" : "border-slate-200/70 hover:border-brand-200",
      )}
    >
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-slate-100 sm:aspect-auto sm:w-52 lg:w-56">
        <Foto
          src={b.capa_url}
          alt={`Foto do ${b.nome_fantasia}`}
          className="absolute inset-0 size-full transition duration-500 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
        <span
          className={cn(
            "absolute left-3 top-3 grid size-7 place-items-center rounded-full text-xs font-bold shadow-md ring-2 ring-white transition",
            destacado ? "bg-accent-400 text-brand-950" : "bg-brand-600 text-white",
          )}
          aria-label={`Número ${numero} no mapa`}
        >
          {numero}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="space-y-1">
          <h3 className="text-lg font-bold leading-snug tracking-tight text-slate-900">
            <Link
              href={`/buffet/${b.id}`}
              className="transition after:absolute after:inset-0 after:rounded-[var(--radius-card)] group-hover:text-brand-700 focus-visible:outline-none focus-visible:after:ring-4 focus-visible:after:ring-brand-300"
            >
              {b.nome_fantasia}
            </Link>
          </h3>
          <NotaBuffet nota={b.nota_media} total={b.total_avaliacoes} />
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600">
          <li className="flex min-w-0 items-center gap-1.5">
            <MapPin className="size-4 shrink-0 text-slate-400" />
            <span className="truncate">{localizacao(b.endereco, b.cidade)}</span>
          </li>
          {b.capacidade_maxima != null && (
            <li className="flex items-center gap-1.5">
              <Users className="size-4 shrink-0 text-slate-400" />
              até {b.capacidade_maxima} convidados
            </li>
          )}
          {b.estilo_culinaria && (
            <li className="flex items-center gap-1.5">
              <ChefHat className="size-4 shrink-0 text-slate-400" />
              {b.estilo_culinaria}
            </li>
          )}
        </ul>

        {tiposVisiveis.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Tipos de evento atendidos">
            {tiposVisiveis.map((t) => (
              <li key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {t}
              </li>
            ))}
            {tiposRestantes > 0 && (
              <li className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                +{tiposRestantes}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <BotaoComparar buffet={b} />
          <p className="text-right leading-tight">
            {b.preco_min != null ? (
              <>
                <span className="block text-xs text-slate-500">a partir de</span>
                <span className="text-xl font-extrabold tracking-tight text-brand-700">{moeda(b.preco_min)}</span>
                <span className="text-xs text-slate-500">/pessoa</span>
              </>
            ) : (
              <span className="text-sm text-slate-500">Preço sob consulta</span>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
