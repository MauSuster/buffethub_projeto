import { ArrowRight, CalendarCheck, CircleCheckBig, CreditCard, FileText, Receipt } from "lucide-react";
import { dataHora, dataPorExtenso, moeda } from "@/lib/formatos";
import type { Negociacao } from "@/lib/database.types";
import { BotaoLink } from "@/components/ui/botao";
import { BotaoCopiar } from "@/components/cliente/botao-copiar";

/** Dados do pagamento aprovado: código da transação, forma de pagamento, valor e data. */
export function DadosPagamento({ n }: { n: Negociacao }) {
  return (
    <dl className="divide-y divide-slate-100 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
        <dt className="text-slate-500">Código da transação</dt>
        <dd className="flex items-center gap-2">
          <code className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-800">
            {n.codigo_transacao ?? "—"}
          </code>
          {n.codigo_transacao && <BotaoCopiar texto={n.codigo_transacao} rotulo="Copiar" />}
        </dd>
      </div>
      <div className="flex justify-between gap-2 py-2.5">
        <dt className="text-slate-500">Forma de pagamento</dt>
        <dd className="font-medium text-slate-800">{n.pagamento_metodo ?? "—"}</dd>
      </div>
      <div className="flex justify-between gap-2 py-2.5">
        <dt className="text-slate-500">Valor pago</dt>
        <dd className="font-semibold text-slate-900">{moeda(n.valor_total)}</dd>
      </div>
      <div className="flex justify-between gap-2 py-2.5">
        <dt className="text-slate-500">Data do pagamento</dt>
        <dd className="font-medium text-slate-800">{dataHora(n.data_pagamento)}</dd>
      </div>
    </dl>
  );
}

/** Tela de confirmação do pagamento (UC14, pós-condição): data reservada e comprovante. */
export function ComprovantePagamento({ n, recemPago }: { n: Negociacao; recemPago: boolean }) {
  return (
    <div className="card overflow-hidden">
      <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-700 px-6 py-8 text-center text-white sm:py-10">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-white/15 ring-8 ring-white/10">
          <CircleCheckBig className="size-9" />
        </div>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{recemPago ? "Pagamento aprovado!" : "Este contrato já está pago"}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-emerald-50">
          Sua reserva no <strong>{n.buffet_nome}</strong> está confirmada. Cliente e buffet já foram avisados.
        </p>
      </div>
      <div className="space-y-5 p-5 sm:p-8">
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800">
          <CalendarCheck className="size-5 shrink-0" />
          <p className="text-sm">
            Data reservada: <strong>{dataPorExtenso(n.data_evento)}</strong>
          </p>
        </div>
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Receipt className="size-4 text-slate-400" /> Comprovante
          </h2>
          <DadosPagamento n={n} />
        </div>
        <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
          <CreditCard className="size-3.5 shrink-0" /> Ambiente de testes: nenhum valor foi cobrado de verdade.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <BotaoLink href="/cliente/reservas" tamanho="lg" className="sm:flex-1">
            Ver minhas reservas <ArrowRight className="size-4" />
          </BotaoLink>
          {n.contrato_id && (
            <BotaoLink href={`/cliente/contratos/${n.contrato_id}`} variante="secundario" tamanho="lg">
              <FileText className="size-4" /> Ver contrato
            </BotaoLink>
          )}
        </div>
      </div>
    </div>
  );
}
