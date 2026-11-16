import Link from "next/link";
import { ArrowRight, Clock, Hourglass, MessageSquare, Store } from "lucide-react";
import { cn } from "@/lib/cn";
import { data as dataBR, moeda, tempoRelativo } from "@/lib/formatos";
import type { Negociacao } from "@/lib/database.types";
import { Alerta, Foto, SeloStatus } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";
import { InfoEvento } from "@/components/cliente/info-evento";
import { AcoesProposta } from "@/components/cliente/acoes-proposta";
import { CancelarSolicitacao } from "@/components/cliente/cancelar-solicitacao";
import { prazoAte } from "@/components/cliente/utilidades";

function BlocoProposta({ n, hoje }: { n: Negociacao; hoje: string }) {
  const pendente = n.status_proposta === "Pendente";
  const prazo = n.proposta_validade ? prazoAte(n.proposta_validade, hoje) : "";
  const vencida = n.status_proposta === "Expirada";
  return (
    <section
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        pendente ? "border-accent-200 bg-gradient-to-br from-accent-50 to-white" : "border-slate-200 bg-slate-50/70",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proposta do buffet</p>
          <p className={cn("text-2xl font-extrabold tracking-tight", vencida ? "text-slate-400 line-through" : "text-brand-700")}>
            {moeda(n.valor_total)}
          </p>
        </div>
        {n.status_proposta && <SeloStatus status={n.status_proposta} />}
      </div>
      {n.proposta_descricao && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{n.proposta_descricao}</p>}
      {n.proposta_validade && (
        <p className={cn("mt-3 flex items-center gap-1.5 text-xs", pendente && prazo === "hoje" ? "font-semibold text-amber-700" : "text-slate-500")}>
          <Clock className="size-3.5" />
          Válida até {dataBR(n.proposta_validade)}
          {(pendente || vencida) && <> · {vencida ? `venceu ${prazo}` : `vence ${prazo}`}</>}
        </p>
      )}

      {pendente && n.proposta_id && n.valor_total != null && (
        <div className="mt-4">
          <AcoesProposta propostaId={n.proposta_id} buffetId={n.buffet_id} buffetNome={n.buffet_nome} valor={n.valor_total} />
        </div>
      )}

      {n.status_proposta === "Aceita" && n.contrato_id && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
          <p className="flex items-center gap-2 text-sm text-slate-600">
            Contrato: {n.status_contrato && <SeloStatus status={n.status_contrato} />}
          </p>
          <BotaoLink href={`/cliente/contratos/${n.contrato_id}`} variante="secundario" tamanho="sm">
            Ver contrato <ArrowRight className="size-3.5" />
          </BotaoLink>
        </div>
      )}

      {vencida && (
        <Alerta tipo="aviso" className="mt-4">
          Esta proposta passou da validade e não pode mais ser aceita. Se ainda tiver interesse, fale com o buffet.
        </Alerta>
      )}
      {n.status_proposta === "Recusada" && <p className="mt-3 text-sm text-slate-500">Você recusou esta proposta.</p>}
    </section>
  );
}

/** Card de uma solicitação de orçamento (T7.1) com a proposta, quando houver. */
export function CartaoSolicitacao({ n, hoje }: { n: Negociacao; hoje: string }) {
  const destaque = n.status_proposta === "Pendente";
  return (
    <article className={cn("card overflow-hidden", destaque && "ring-2 ring-accent-300/70")}>
      <div className="flex flex-col gap-5 p-4 sm:p-6 md:flex-row">
        <Link href={`/buffet/${n.buffet_id}`} className="group shrink-0 overflow-hidden rounded-2xl md:w-40">
          <Foto
            src={n.buffet_capa_url}
            alt={`Foto do ${n.buffet_nome}`}
            className="h-40 w-full transition duration-300 group-hover:scale-105 md:h-32"
          />
        </Link>

        <div className="min-w-0 flex-1 space-y-4">
          <header className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/buffet/${n.buffet_id}`} className="text-lg font-bold text-slate-900 hover:text-brand-700">
                {n.buffet_nome}
              </Link>
              <p className="text-xs text-slate-500">
                Solicitado {tempoRelativo(n.data_solicitacao)} · {dataBR(n.data_solicitacao)}
              </p>
            </div>
            <SeloStatus status={n.status_solicitacao} />
          </header>

          <InfoEvento n={n} />

          {n.observacoes && (
            <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Suas observações: </span>
              {n.observacoes}
            </p>
          )}

          {n.proposta_id ? (
            <BlocoProposta n={n} hoje={hoje} />
          ) : n.status_solicitacao === "Pendente" ? (
            <div className="flex items-start gap-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
              <Hourglass className="mt-0.5 size-4 shrink-0" />
              <p>
                Aguardando a proposta do buffet. Você recebe um aviso assim que ela chegar.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Você cancelou esta solicitação.</p>
          )}

          <footer className="flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3">
            <BotaoLink href={`/cliente/mensagens?com=${n.buffet_id}`} variante="fantasma" tamanho="sm">
              <MessageSquare className="size-3.5" /> Mensagem
            </BotaoLink>
            <BotaoLink href={`/buffet/${n.buffet_id}`} variante="fantasma" tamanho="sm">
              <Store className="size-3.5" /> Ver buffet
            </BotaoLink>
            {n.status_solicitacao === "Pendente" && (
              <div className="ml-auto">
                <CancelarSolicitacao solicitacaoId={n.solicitacao_id} />
              </div>
            )}
          </footer>
        </div>
      </div>
    </article>
  );
}
