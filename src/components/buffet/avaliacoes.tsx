import { ChevronDown, MessageSquareQuote } from "lucide-react";
import { Avatar, Estrelas, Vazio } from "@/components/ui/basicos";
import { formatarNota } from "@/components/buffet/secao";
import type { Avaliacao } from "@/lib/database.types";

const VISIVEIS = 4;

function mesAno(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
}

function CartaoAvaliacao({ a }: { a: Avaliacao }) {
  const autor = a.autor_nome ?? "Cliente BuffetHub";
  return (
    <li className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="flex items-center gap-3">
        <Avatar nome={autor} className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{autor}</p>
          <p className="text-xs text-slate-500">{mesAno(a.data)}</p>
        </div>
        <Estrelas nota={a.nota} />
      </div>
      {a.comentario ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{a.comentario}</p>
      ) : (
        <p className="mt-3 text-sm italic text-slate-400">Avaliou sem deixar comentário.</p>
      )}
    </li>
  );
}

export function Avaliacoes({ avaliacoes, media }: { avaliacoes: Avaliacao[]; media: number | null }) {
  if (avaliacoes.length === 0) {
    return (
      <Vazio
        Icone={MessageSquareQuote}
        titulo="Este buffet ainda não tem avaliações."
        texto="As avaliações aparecem aqui depois que os clientes realizam seus eventos."
      />
    );
  }

  const total = avaliacoes.length;
  const nota = media ?? avaliacoes.reduce((s, a) => s + a.nota, 0) / total;
  const distribuicao = [5, 4, 3, 2, 1].map((n) => ({ n, qtd: avaliacoes.filter((a) => a.nota === n).length }));
  const primeiras = avaliacoes.slice(0, VISIVEIS);
  const demais = avaliacoes.slice(VISIVEIS);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 rounded-2xl bg-gradient-to-br from-brand-50 to-white p-5 sm:grid-cols-[180px_1fr] sm:items-center">
        <div className="text-center sm:border-r sm:border-brand-100 sm:pr-6">
          <p className="text-5xl font-extrabold tracking-tight text-slate-900">{formatarNota(nota)}</p>
          <div className="mt-2 flex justify-center">
            <Estrelas nota={nota} tamanho="md" />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {total} {total === 1 ? "avaliação" : "avaliações"}
          </p>
        </div>
        <ul className="space-y-1.5" aria-label="Distribuição das notas">
          {distribuicao.map(({ n, qtd }) => {
            const pct = Math.round((qtd / total) * 100);
            return (
              <li key={n} className="flex items-center gap-3 text-sm">
                <span className="w-14 shrink-0 text-slate-600">
                  {n} {n === 1 ? "estrela" : "estrelas"}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/80">
                  <span className="block h-full rounded-full bg-accent-400" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 shrink-0 text-right tabular-nums text-slate-500">{qtd}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {primeiras.map((a) => (
          <CartaoAvaliacao key={a.id} a={a} />
        ))}
      </ul>

      {demais.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-brand-700 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Ver todas as {total} avaliações</span>
            <span className="hidden group-open:inline">Mostrar menos</span>
            <ChevronDown className="size-4 transition group-open:rotate-180" />
          </summary>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {demais.map((a) => (
              <CartaoAvaliacao key={a.id} a={a} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
