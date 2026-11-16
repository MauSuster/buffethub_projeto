import { Check, Plus, UtensilsCrossed } from "lucide-react";
import { BotaoLink } from "@/components/ui/botao";
import { Selo, Vazio } from "@/components/ui/basicos";
import { separarItens } from "@/components/buffet/secao";
import { moeda } from "@/lib/formatos";
import type { Pacote } from "@/lib/database.types";

export function ListaPacotes({ pacotes, buffetId, podeEscolher }: { pacotes: Pacote[]; buffetId: string; podeEscolher: boolean }) {
  if (pacotes.length === 0) {
    return (
      <Vazio
        Icone={UtensilsCrossed}
        titulo="Nenhum pacote publicado ainda"
        texto="Peça um orçamento contando o que você precisa: o buffet monta uma proposta sob medida."
      />
    );
  }
  const menorPreco = Math.min(...pacotes.map((p) => p.preco_por_pessoa));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pacotes.map((p) => {
        const itens = separarItens(p.itens_cardapio);
        const adicionais = separarItens(p.servicos_adicionais);
        const destaque = pacotes.length > 1 && p.preco_por_pessoa === menorPreco;
        return (
          <article
            key={p.id}
            className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
          >
            {destaque && (
              <Selo cor="amarelo" className="absolute -top-2.5 right-4 shadow-sm">
                Mais econômico
              </Selo>
            )}
            <h3 className="text-base font-bold text-slate-900">{p.nome}</h3>
            <p className="mt-1">
              <span className="text-2xl font-extrabold tracking-tight text-brand-700">{moeda(p.preco_por_pessoa)}</span>
              <span className="text-sm text-slate-500"> por pessoa</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {itens.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            {adicionais.length > 0 && (
              <div className="mt-4 rounded-xl bg-accent-50 px-3 py-2.5 text-sm text-accent-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">Adicionais</p>
                <ul className="mt-1 space-y-1">
                  {adicionais.map((a) => (
                    <li key={a} className="flex items-center gap-1.5">
                      <Plus className="size-3.5 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {podeEscolher && (
              <BotaoLink
                href={`/buffet/${buffetId}/orcamento?pacote=${p.id}`}
                variante={destaque ? "primario" : "secundario"}
                className="mt-5 w-full"
              >
                Escolher este pacote
              </BotaoLink>
            )}
          </article>
        );
      })}
    </div>
  );
}
