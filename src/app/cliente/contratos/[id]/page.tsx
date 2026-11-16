import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CreditCard, MessageSquare, PenLine, RotateCw, ScrollText, ShieldCheck, Star } from "lucide-react";
import { exigirCliente } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { dataHora, moeda } from "@/lib/formatos";
import { obterContrato } from "@/models/cliente";
import { Alerta, Cartao, Estrelas, Foto, SeloStatus, TituloPagina } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";
import { InfoEvento } from "@/components/cliente/info-evento";
import { LinhaDoTempo } from "@/components/cliente/linha-tempo";
import { TermosContrato } from "@/components/cliente/termos-contrato";
import { AssinaturaContrato } from "@/components/cliente/assinatura-contrato";
import { DadosPagamento } from "@/components/cliente/comprovante";
import { numeroContrato } from "@/components/cliente/utilidades";

export const metadata: Metadata = { title: "Contrato" };

function Voltar() {
  return (
    <Link href="/cliente/contratos" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
      <ArrowLeft className="size-4" /> Meus contratos
    </Link>
  );
}

// T7.2 Detalhe do contrato (UC12 Visualizar Contrato e UC13 Assinar Contrato)
export default async function PaginaContrato(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const { id } = await props.params;
  const params = await props.searchParams;
  const sessao = await exigirCliente(`/cliente/contratos/${id}`);
  const { detalhe, erro } = await obterContrato(id, sessao.id);

  if (erro) {
    return (
      <div className="space-y-6">
        <Voltar />
        <Alerta tipo="erro" titulo="Erro ao abrir o contrato">
          <p>{erro}</p>
          <Link href={`/cliente/contratos/${id}`} className="mt-2 inline-flex items-center gap-1.5 font-semibold underline">
            <RotateCw className="size-3.5" /> Tentar novamente
          </Link>
        </Alerta>
      </div>
    );
  }
  if (!detalhe) notFound();

  const { contrato, negociacao: n } = detalhe;
  const status = contrato.status;
  const pago = status === "Pago" || status === "Concluído";
  const acaoPrimeiro = status !== "Aguardando assinatura";

  return (
    <div className="space-y-6">
      <Voltar />
      <TituloPagina
        titulo={`Contrato com ${n.buffet_nome}`}
        subtitulo={`Contrato ${numeroContrato(contrato.id)} · gerado em ${dataHora(contrato.data_criacao)}`}
        acoes={<SeloStatus status={status} />}
      />

      {params.aceita === "1" && status === "Aguardando assinatura" && (
        <Alerta tipo="sucesso" titulo="Proposta aceita! O contrato foi gerado.">
          Leia os termos abaixo e assine para seguir para o pagamento.
        </Alerta>
      )}
      {params.assinado === "1" && status === "Assinado" && (
        <Alerta tipo="sucesso" titulo="Contrato assinado com sucesso">
          O buffet foi avisado. Agora é só fazer o pagamento para reservar a data do seu evento.
        </Alerta>
      )}

      <Cartao className="p-5 sm:p-6">
        <LinhaDoTempo n={n} />
      </Cartao>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ScrollText className="size-5 text-brand-600" /> Termos do contrato
          </h2>
          <TermosContrato termos={contrato.termos} />
        </section>

        <aside className={cn("space-y-4 lg:sticky lg:top-24", acaoPrimeiro && "order-first lg:order-none")}>
          {status === "Aguardando assinatura" && (
            <Cartao className="p-5">
              <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <PenLine className="size-4 text-brand-600" /> Assinatura
              </h2>
              <AssinaturaContrato contratoId={contrato.id} nomeCadastro={sessao.nome} />
            </Cartao>
          )}

          {status === "Assinado" && (
            <Cartao className="overflow-hidden">
              <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
                <p className="flex items-center gap-2 text-sm font-semibold text-brand-100">
                  <ShieldCheck className="size-4" /> Contrato assinado
                </p>
                <p className="mt-1 text-2xl font-extrabold">{moeda(n.valor_total)}</p>
                <p className="mt-1 text-xs text-brand-100">
                  Assinado por {contrato.assinado_por} em {dataHora(contrato.data_assinatura)}
                </p>
              </div>
              <div className="space-y-3 p-5">
                <p className="text-sm text-slate-600">A data do evento só fica reservada depois que o pagamento for aprovado.</p>
                <BotaoLink href={`/pagamento/${contrato.id}`} variante="destaque" tamanho="lg" className="w-full">
                  <CreditCard className="size-5" /> Pagar agora
                </BotaoLink>
                <p className="text-center text-xs text-slate-400">Pix, cartão de crédito ou boleto</p>
              </div>
            </Cartao>
          )}

          {pago && (
            <Cartao className="p-5">
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="size-4 text-emerald-600" /> Pagamento confirmado
              </h2>
              <DadosPagamento n={n} />
              {status === "Concluído" && !n.avaliacao_id ? (
                <BotaoLink href="/cliente/reservas" variante="destaque" className="mt-3 w-full">
                  <Star className="size-4" /> Avaliar o buffet
                </BotaoLink>
              ) : status === "Concluído" && n.avaliacao_nota ? (
                <p className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
                  Sua avaliação <Estrelas nota={n.avaliacao_nota} />
                </p>
              ) : (
                <BotaoLink href="/cliente/reservas" variante="secundario" className="mt-3 w-full">
                  Ver minhas reservas
                </BotaoLink>
              )}
            </Cartao>
          )}

          <Cartao className="p-5">
            <Link href={`/buffet/${n.buffet_id}`} className="group flex items-center gap-3">
              <Foto src={n.buffet_capa_url} alt={`Foto do ${n.buffet_nome}`} className="size-14 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contratada</p>
                <p className="truncate font-bold text-slate-900 group-hover:text-brand-700">{n.buffet_nome}</p>
              </div>
            </Link>
            <InfoEvento n={n} umaColuna className="mt-5" />
            <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Criado em</dt>
                <dd className="font-medium text-slate-700">{dataHora(contrato.data_criacao)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Assinatura</dt>
                <dd className="text-right font-medium text-slate-700">
                  {contrato.assinado ? dataHora(contrato.data_assinatura) : "Ainda não assinado"}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-3 pt-2">
                <dt className="font-semibold text-slate-900">Valor total</dt>
                <dd className="text-2xl font-extrabold tracking-tight text-brand-700">{moeda(n.valor_total)}</dd>
              </div>
            </dl>
            <BotaoLink href={`/cliente/mensagens?com=${n.buffet_id}`} variante="fantasma" className="mt-4 w-full">
              <MessageSquare className="size-4" /> Falar com o buffet
            </BotaoLink>
          </Cartao>
        </aside>
      </div>
    </div>
  );
}
