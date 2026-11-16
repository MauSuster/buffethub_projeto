import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarCheck, Check, RotateCw } from "lucide-react";
import { exigirCliente } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { data as dataBR, dataPorExtenso, hojeISO, moeda } from "@/lib/formatos";
import { obterContrato } from "@/models/cliente";
import { Alerta, Foto, SeloStatus } from "@/components/ui/basicos";
import { Checkout } from "@/components/cliente/checkout";
import { ComprovantePagamento } from "@/components/cliente/comprovante";
import { numeroContrato } from "@/components/cliente/utilidades";

export const metadata: Metadata = { title: "Pagamento" };

const ETAPAS = ["Proposta aceita", "Contrato assinado", "Pagamento"];

function Etapas() {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      {ETAPAS.map((etapa, i) => {
        const atual = i === ETAPAS.length - 1;
        return (
          <li key={etapa} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-5 bg-slate-300" aria-hidden />}
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full text-[10px] font-bold",
                atual ? "bg-accent-400 text-brand-950" : "bg-brand-600 text-white",
              )}
            >
              {atual ? i + 1 : <Check className="size-3" />}
            </span>
            <span className={atual ? "font-semibold text-brand-700" : "text-slate-500"}>{etapa}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-slate-500">{rotulo}</dt>
      <dd className="text-right font-medium text-slate-800">{children}</dd>
    </div>
  );
}

// T6.0 Checkout / Pagamento (UC14)
export default async function PaginaPagamento(props: {
  params: Promise<{ contratoId: string }>;
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const { contratoId } = await props.params;
  const params = await props.searchParams;
  const sessao = await exigirCliente(`/pagamento/${contratoId}`);
  const { detalhe, erro } = await obterContrato(contratoId, sessao.id);

  if (erro) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Alerta tipo="erro" titulo="Não foi possível abrir o pagamento">
          <p>{erro}</p>
          <Link href={`/pagamento/${contratoId}`} className="mt-2 inline-flex items-center gap-1.5 font-semibold underline">
            <RotateCw className="size-3.5" /> Tentar novamente
          </Link>
        </Alerta>
      </div>
    );
  }
  if (!detalhe) notFound();

  const { contrato, negociacao: n } = detalhe;
  if (contrato.status === "Aguardando assinatura") redirect(`/cliente/contratos/${contratoId}`);

  if (contrato.status === "Pago" || contrato.status === "Concluído") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <ComprovantePagamento n={n} recemPago={params.sucesso === "1"} />
      </div>
    );
  }

  const diaSemana = dataPorExtenso(n.data_evento).split(",")[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Pagamento</h1>
          <Etapas />
        </div>
        <Link
          href={`/cliente/contratos/${contratoId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          <ArrowLeft className="size-4" /> Voltar ao contrato
        </Link>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <aside className="card p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <Foto src={n.buffet_capa_url} alt={`Foto do ${n.buffet_nome}`} className="size-14 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">Resumo do contrato</h2>
              <p className="text-xs text-slate-500">Contrato {numeroContrato(contrato.id)}</p>
            </div>
          </div>
          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            <Linha rotulo="Buffet">{n.buffet_nome}</Linha>
            <Linha rotulo="Evento">{n.tipo_evento}</Linha>
            <Linha rotulo="Data">
              {dataBR(n.data_evento)} <span className="font-normal text-slate-500">({diaSemana})</span>
            </Linha>
            <Linha rotulo="Convidados">{n.num_convidados}</Linha>
            <Linha rotulo="Local">{n.local}</Linha>
            {n.pacote_nome && (
              <Linha rotulo="Pacote">
                {n.pacote_nome}
                {n.pacote_preco_por_pessoa != null && (
                  <span className="block text-xs font-normal text-slate-500">{moeda(n.pacote_preco_por_pessoa)} por pessoa</span>
                )}
              </Linha>
            )}
            <Linha rotulo="Contrato">
              <SeloStatus status={contrato.status} />
            </Linha>
          </dl>
          <div className="mt-2 flex items-end justify-between gap-4 border-t border-slate-200 pt-4">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="text-3xl font-extrabold tracking-tight text-brand-700">{moeda(n.valor_total)}</span>
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
            <CalendarCheck className="mt-0.5 size-3.5 shrink-0" />
            Valor definido na proposta aceita. A data do evento fica reservada no calendário do buffet assim que o pagamento for
            aprovado.
          </p>
        </aside>

        <Checkout contratoId={contrato.id} valor={n.valor_total ?? 0} hoje={hojeISO()} />
      </div>
    </div>
  );
}
