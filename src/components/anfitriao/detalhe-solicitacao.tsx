import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  Hourglass,
  MapPin,
  MessageSquare,
  Package,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Negociacao, StatusData } from "@/lib/database.types";
import { data as dataBR, dataHora, moeda, tempoRelativo } from "@/lib/formatos";
import { Alerta, Avatar, Cartao, SeloStatus } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";
import { FormProposta } from "./form-proposta";
import { diaDaSemana, somarDias } from "./datas";
import { estimativa as calcularEstimativa } from "./negociacao";

type EstadoEtapa = "feito" | "atual" | "aguardando" | "falhou";
type Etapa = { titulo: string; texto: string; estado: EstadoEtapa };

function etapasDaNegociacao(n: Negociacao): Etapa[] {
  const etapas: Etapa[] = [
    { titulo: "Pedido recebido", texto: dataHora(n.data_solicitacao), estado: "feito" },
    {
      titulo: "Proposta enviada",
      texto: `${moeda(n.valor_total)} · enviada em ${dataHora(n.proposta_criada_em)}`,
      estado: "feito",
    },
  ];
  if (n.status_proposta === "Recusada") {
    etapas.push({ titulo: "Proposta recusada", texto: "O cliente recusou esta proposta.", estado: "falhou" });
    return etapas;
  }
  if (n.status_proposta === "Expirada") {
    etapas.push({
      titulo: "Proposta expirada",
      texto: `A validade terminou em ${dataBR(n.proposta_validade)} sem resposta do cliente.`,
      estado: "falhou",
    });
    return etapas;
  }
  if (n.status_proposta === "Pendente") {
    etapas.push({
      titulo: "Resposta do cliente",
      texto: `Aguardando o cliente aceitar ou recusar (válida até ${dataBR(n.proposta_validade)}).`,
      estado: "atual",
    });
  } else {
    etapas.push({ titulo: "Proposta aceita", texto: "O contrato foi gerado para o cliente assinar.", estado: "feito" });
  }

  const contrato = n.status_contrato;
  const assinado = contrato === "Assinado" || contrato === "Pago" || contrato === "Concluído";
  const pago = contrato === "Pago" || contrato === "Concluído";
  etapas.push(
    assinado
      ? { titulo: "Contrato assinado", texto: dataHora(n.data_assinatura), estado: "feito" }
      : {
          titulo: "Assinatura do contrato",
          texto: contrato ? "Aguardando o cliente assinar." : "Depois que o cliente aceitar a proposta.",
          estado: contrato ? "atual" : "aguardando",
        },
  );
  etapas.push(
    pago
      ? {
          titulo: "Pagamento confirmado",
          texto: [n.pagamento_metodo, dataHora(n.data_pagamento), n.codigo_transacao && `código ${n.codigo_transacao}`]
            .filter(Boolean)
            .join(" · "),
          estado: "feito",
        }
      : {
          titulo: "Pagamento",
          texto: contrato === "Assinado" ? "Aguardando o pagamento do cliente." : "Depois da assinatura do contrato.",
          estado: contrato === "Assinado" ? "atual" : "aguardando",
        },
  );
  etapas.push(
    contrato === "Concluído"
      ? {
          titulo: "Evento realizado",
          texto: n.avaliacao_nota != null ? `O cliente avaliou com nota ${n.avaliacao_nota} de 5.` : "O cliente ainda pode avaliar o buffet.",
          estado: "feito",
        }
      : {
          titulo: "Evento",
          texto: pago ? `Data reservada no seu calendário: ${dataBR(n.data_evento)}.` : `Previsto para ${dataBR(n.data_evento)}.`,
          estado: pago ? "atual" : "aguardando",
        },
  );
  return etapas;
}

const ICONE_ETAPA: Record<EstadoEtapa, { Icone: LucideIcon; classe: string }> = {
  feito: { Icone: Check, classe: "bg-emerald-500 text-white" },
  atual: { Icone: Hourglass, classe: "bg-brand-600 text-white ring-4 ring-brand-100" },
  aguardando: { Icone: Hourglass, classe: "bg-slate-100 text-slate-400" },
  falhou: { Icone: X, classe: "bg-red-500 text-white" },
};

function Andamento({ n }: { n: Negociacao }) {
  const etapas = etapasDaNegociacao(n);
  return (
    <ol className="space-y-0">
      {etapas.map((etapa, i) => {
        const { Icone, classe } = ICONE_ETAPA[etapa.estado];
        return (
          <li key={etapa.titulo} className="relative flex gap-3 pb-5 last:pb-0">
            {i < etapas.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 bg-slate-200" aria-hidden />}
            <span className={cn("relative grid size-8 shrink-0 place-items-center rounded-full", classe)}>
              <Icone className="size-4" />
            </span>
            <div className="pt-1">
              <p className={cn("text-sm font-semibold", etapa.estado === "aguardando" ? "text-slate-400" : "text-slate-800")}>
                {etapa.titulo}
              </p>
              <p className={cn("text-xs", etapa.estado === "aguardando" ? "text-slate-400" : "text-slate-500")}>{etapa.texto}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Info({ Icone, rotulo, children, className }: { Icone: LucideIcon; rotulo: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex gap-3", className)}>
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icone className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-slate-500">{rotulo}</dt>
        <dd className="text-sm font-semibold text-slate-800">{children}</dd>
      </div>
    </div>
  );
}

/** T8.4: detalhe da solicitação com a proposta (pendente) ou o andamento da negociação (respondida). */
export function DetalheSolicitacao({ n, hoje, situacaoData, enviada, voltarPara }: {
  n: Negociacao;
  hoje: string;
  situacaoData: StatusData | null;
  enviada: boolean;
  voltarPara: string;
}) {
  const cliente = n.cliente_nome ?? "Cliente";
  const estimativa = calcularEstimativa(n);
  const eventoPassou = n.data_evento < hoje;
  const validadePadrao = somarDias(hoje, 7) < n.data_evento ? somarDias(hoje, 7) : n.data_evento;
  const descricaoSugerida = n.pacote_nome
    ? `Pacote ${n.pacote_nome} para ${n.num_convidados} convidados (${moeda(n.pacote_preco_por_pessoa)} por pessoa).`
    : "";

  return (
    <Cartao id="detalhe" className="scroll-mt-24 overflow-hidden">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <Link href={voltarPara} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 lg:hidden">
          <ArrowLeft className="size-4" /> Voltar para a lista
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar nome={cliente} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Pedido de {cliente}</h2>
                <SeloStatus status={n.status_solicitacao} />
              </div>
              <p className="text-sm text-slate-500">
                Recebido em {dataHora(n.data_solicitacao)} ({tempoRelativo(n.data_solicitacao)})
              </p>
            </div>
          </div>
          <BotaoLink href={`/anfitriao/mensagens?com=${n.cliente_id}`} variante="secundario" tamanho="sm">
            <MessageSquare className="size-4" /> Mensagem
          </BotaoLink>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {enviada && (
          <Alerta tipo="sucesso" titulo="Proposta enviada!">
            O cliente foi avisado e já pode aceitar ou recusar a proposta.
          </Alerta>
        )}

        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Info Icone={Sparkles} rotulo="Tipo de evento">
            {n.tipo_evento}
          </Info>
          <Info Icone={CalendarDays} rotulo="Data">
            {dataBR(n.data_evento)} <span className="font-normal text-slate-500">({diaDaSemana(n.data_evento)})</span>
          </Info>
          <Info Icone={MapPin} rotulo="Local">
            {n.local}
          </Info>
          <Info Icone={Users} rotulo="Nº de convidados">
            {n.num_convidados}
          </Info>
          <Info Icone={ClipboardList} rotulo="Serviços desejados">
            {n.servicos_desejados ?? <span className="font-normal text-slate-400">Não informado</span>}
          </Info>
          <Info Icone={Package} rotulo="Pacote de interesse">
            {n.pacote_nome ? (
              <>
                {n.pacote_nome} <span className="font-normal text-slate-500">({moeda(n.pacote_preco_por_pessoa)}/pessoa)</span>
              </>
            ) : (
              <span className="font-normal text-slate-400">Nenhum pacote escolhido</span>
            )}
          </Info>
        </dl>

        {estimativa != null && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-brand-50 px-4 py-3">
            <p className="text-sm text-brand-800">
              Estimativa pelo pacote: {moeda(n.pacote_preco_por_pessoa)} × {n.num_convidados} convidados
            </p>
            <p className="text-lg font-bold text-brand-800">{moeda(estimativa)}</p>
          </div>
        )}

        {n.observacoes && (
          <figure className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <figcaption className="text-xs font-medium text-slate-500">Observações do cliente</figcaption>
            <blockquote className="mt-1 whitespace-pre-line text-sm text-slate-700">“{n.observacoes}”</blockquote>
          </figure>
        )}

        {n.status_solicitacao === "Pendente" && (
          <section className="border-t border-slate-100 pt-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Responder com proposta</h3>
            {eventoPassou ? (
              <Alerta tipo="aviso">A data do evento já passou. Não é mais possível enviar proposta para este pedido.</Alerta>
            ) : (
              <div className="space-y-4">
                {situacaoData && situacaoData !== "Livre" && (
                  <Alerta tipo={situacaoData === "Reservada" ? "erro" : "aviso"} titulo="Data indisponível no calendário">
                    {situacaoData === "Reservada"
                      ? "Esta data já está reservada por outro evento. Combine outra data com o cliente pelas mensagens."
                      : "Você bloqueou esta data no calendário. "}
                    {situacaoData === "Bloqueada" && (
                      <Link href={`/anfitriao/calendario?mes=${n.data_evento.slice(0, 7)}`} className="font-semibold underline">
                        Liberar a data no calendário
                      </Link>
                    )}
                  </Alerta>
                )}
                <FormProposta
                  solicitacaoId={n.solicitacao_id}
                  estimativa={estimativa}
                  descricaoSugerida={descricaoSugerida}
                  hoje={hoje}
                  dataEvento={n.data_evento}
                  validadePadrao={validadePadrao}
                  situacaoData={situacaoData ?? "Livre"}
                />
                <p className="text-xs text-slate-400">
                  Se preferir, responda depois: o pedido continua pendente até você enviar a proposta.
                </p>
              </div>
            )}
          </section>
        )}

        {n.status_solicitacao === "Respondida" && (
          <section className="space-y-5 border-t border-slate-100 pt-6">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-900">Proposta enviada</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {n.status_proposta && (
                    <span className="inline-flex items-center gap-1">
                      Proposta <SeloStatus status={n.status_proposta} />
                    </span>
                  )}
                  {n.status_contrato && (
                    <span className="inline-flex items-center gap-1">
                      Contrato <SeloStatus status={n.status_contrato} />
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Valor total</p>
                    <p className="text-2xl font-bold text-slate-900">{moeda(n.valor_total)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-500">Validade</p>
                    <p className="text-sm font-semibold text-slate-800">{dataBR(n.proposta_validade)}</p>
                  </div>
                </div>
                {n.proposta_descricao && (
                  <p className="mt-3 whitespace-pre-line border-t border-slate-100 pt-3 text-sm text-slate-600">{n.proposta_descricao}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Andamento</h3>
              <Andamento n={n} />
            </div>
          </section>
        )}

        {n.status_solicitacao === "Cancelada" && (
          <Alerta tipo="aviso" titulo="Solicitação cancelada">
            O cliente cancelou este pedido de orçamento antes de receber uma proposta.
          </Alerta>
        )}
      </div>
    </Cartao>
  );
}
