import Link from "next/link";
import { Suspense } from "react";
import { Inbox, Users } from "lucide-react";
import { exigirBuffet } from "@/lib/auth";
import { cn } from "@/lib/cn";
import type { Negociacao } from "@/lib/database.types";
import { data as dataBR, hojeISO, tempoRelativo } from "@/lib/formatos";
import { Avatar, Selo, SeloStatus, TituloPagina, Vazio } from "@/components/ui/basicos";
import { DetalheSolicitacao } from "@/components/anfitriao/detalhe-solicitacao";
import { ErroCarregamento, EsqueletoSolicitacoes } from "@/components/anfitriao/estados";
import { situacaoNegociacao } from "@/components/anfitriao/negociacao";
import * as modelo from "@/models/anfitriao";

export const metadata = { title: "Solicitações de orçamento" };

type Busca = Promise<{ aba?: string | string[]; id?: string | string[]; enviada?: string | string[] }>;

const ABAS: { chave: string; rotulo: string; filtro: (n: Negociacao) => boolean; vazio: string }[] = [
  {
    chave: "pendentes",
    rotulo: "Pendentes",
    filtro: (n) => n.status_solicitacao === "Pendente",
    vazio: "Nenhum pedido esperando proposta. Quando um cliente pedir orçamento, ele aparece aqui.",
  },
  {
    chave: "respondidas",
    rotulo: "Respondidas",
    filtro: (n) => n.status_solicitacao === "Respondida",
    vazio: "Você ainda não respondeu nenhuma solicitação.",
  },
  {
    chave: "canceladas",
    rotulo: "Canceladas",
    filtro: (n) => n.status_solicitacao === "Cancelada",
    vazio: "Nenhuma solicitação foi cancelada pelos clientes.",
  },
  {
    chave: "todas",
    rotulo: "Todas",
    filtro: () => true,
    vazio: "Você ainda não recebeu pedidos de orçamento. Mantenha seu perfil e seus pacotes atualizados.",
  },
];

const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

// T8.4 Solicitações de Orçamento (UC20)
export default function Solicitacoes({ searchParams }: { searchParams: Busca }) {
  return (
    <>
      <TituloPagina
        titulo="Solicitações de orçamento"
        subtitulo="Veja os pedidos dos clientes, envie propostas e acompanhe cada negociação."
      />
      <Suspense fallback={<EsqueletoSolicitacoes />}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Conteudo({ searchParams }: { searchParams: Busca }) {
  const sessao = await exigirBuffet("/anfitriao/solicitacoes");
  const busca = await searchParams;
  const aba = ABAS.find((a) => a.chave === texto(busca.aba)) ?? ABAS[0];
  const idEscolhido = texto(busca.id);

  await modelo.atualizarStatusPorData();
  const { dados: todas, erro } = await modelo.listarNegociacoes(sessao.id);
  if (erro) return <ErroCarregamento mensagem={erro} />;

  const lista = todas.filter(aba.filtro);
  const selecionada = idEscolhido
    ? (todas.find((n) => n.solicitacao_id === idEscolhido) ?? null)
    : (lista[0] ?? null);
  const hoje = hojeISO();
  const situacaoData =
    selecionada?.status_solicitacao === "Pendente" ? await modelo.statusDaData(sessao.id, selecionada.data_evento) : null;
  const urlAba = `/anfitriao/solicitacoes?aba=${aba.chave}`;

  return (
    <div className="space-y-5">
      <nav aria-label="Filtrar solicitações" className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="inline-flex gap-1 rounded-2xl bg-slate-200/60 p-1">
          {ABAS.map((a) => {
            const quantidade = todas.filter(a.filtro).length;
            const ativa = a.chave === aba.chave;
            return (
              <Link
                key={a.chave}
                href={`/anfitriao/solicitacoes?aba=${a.chave}`}
                aria-current={ativa ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                  ativa ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800",
                )}
              >
                {a.rotulo}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    ativa ? (a.chave === "pendentes" && quantidade > 0 ? "bg-accent-400 text-brand-950" : "bg-brand-50 text-brand-700") : "bg-white/70 text-slate-500",
                  )}
                >
                  {quantidade}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {todas.length === 0 ? (
        <Vazio Icone={Inbox} titulo="Nenhuma solicitação ainda" texto={ABAS[3].vazio} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className={cn("space-y-3", idEscolhido && "hidden lg:block")}>
            {lista.length === 0 ? (
              <Vazio Icone={Inbox} titulo={`Nenhuma solicitação em “${aba.rotulo}”`} texto={aba.vazio} />
            ) : (
              <ul className="space-y-3">
                {lista.map((n) => {
                  const ativa = selecionada?.solicitacao_id === n.solicitacao_id;
                  const situacao = situacaoNegociacao(n);
                  return (
                    <li key={n.solicitacao_id}>
                      <Link
                        href={`${urlAba}&id=${n.solicitacao_id}`}
                        aria-current={ativa ? "true" : undefined}
                        className={cn(
                          "card block p-4 transition hover:-translate-y-0.5 hover:shadow-lift",
                          ativa && "ring-2 ring-brand-500",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar nome={n.cliente_nome ?? "Cliente"} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate font-semibold text-slate-900">{n.cliente_nome ?? "Cliente"}</p>
                              <SeloStatus status={n.status_solicitacao} />
                            </div>
                            <p className="truncate text-sm text-slate-600">
                              {n.tipo_evento} · {dataBR(n.data_evento)}
                            </p>
                            <p className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <Users className="size-3.5" /> {n.num_convidados}
                              </span>
                              <span>Pedido {tempoRelativo(n.data_solicitacao)}</span>
                            </p>
                            {n.status_solicitacao === "Respondida" && (
                              <Selo cor={situacao.cor} className="mt-2">
                                {situacao.rotulo}
                              </Selo>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={cn(!idEscolhido && "hidden lg:block")}>
            {selecionada ? (
              <DetalheSolicitacao
                key={selecionada.solicitacao_id}
                n={selecionada}
                hoje={hoje}
                situacaoData={situacaoData}
                enviada={texto(busca.enviada) === "1" && selecionada.solicitacao_id === idEscolhido}
                voltarPara={urlAba}
              />
            ) : idEscolhido ? (
              <Vazio Icone={Inbox} titulo="Solicitação não encontrada" texto="Ela pode ter sido removida. Escolha outra na lista." />
            ) : (
              <Vazio Icone={Inbox} titulo="Escolha uma solicitação" texto="Os detalhes do pedido aparecem aqui." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
