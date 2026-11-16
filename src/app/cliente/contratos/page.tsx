import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, FileSignature, PenLine, Receipt, Star } from "lucide-react";
import { exigirCliente } from "@/lib/auth";
import { data as dataBR, moeda } from "@/lib/formatos";
import type { Negociacao, StatusContrato } from "@/lib/database.types";
import { listarNegociacoes } from "@/models/cliente";
import { Alerta, Foto, SeloStatus, TituloPagina, Vazio } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";
import { numeroContrato } from "@/components/cliente/utilidades";

export const metadata: Metadata = { title: "Meus contratos" };

const ORDEM: Record<StatusContrato, number> = { "Aguardando assinatura": 0, Assinado: 1, Pago: 2, Concluído: 3 };

function AcaoContrato({ n }: { n: Negociacao }) {
  const id = n.contrato_id!;
  switch (n.status_contrato) {
    case "Aguardando assinatura":
      return (
        <BotaoLink href={`/cliente/contratos/${id}`} tamanho="sm">
          <PenLine className="size-3.5" /> Assinar
        </BotaoLink>
      );
    case "Assinado":
      return (
        <BotaoLink href={`/pagamento/${id}`} variante="destaque" tamanho="sm">
          <CreditCard className="size-3.5" /> Pagar
        </BotaoLink>
      );
    case "Concluído":
      return n.avaliacao_id ? null : (
        <BotaoLink href="/cliente/reservas" variante="secundario" tamanho="sm">
          <Star className="size-3.5" /> Avaliar
        </BotaoLink>
      );
    default:
      return (
        <BotaoLink href={`/pagamento/${id}`} variante="secundario" tamanho="sm">
          <Receipt className="size-3.5" /> Comprovante
        </BotaoLink>
      );
  }
}

// T7.2 Meus contratos (UC12)
export default async function PaginaContratos() {
  const sessao = await exigirCliente("/cliente/contratos");
  const { negociacoes, erro } = await listarNegociacoes(sessao.id);
  const contratos = negociacoes
    .filter((n) => n.contrato_id && n.status_contrato)
    .sort((a, b) => ORDEM[a.status_contrato!] - ORDEM[b.status_contrato!] || a.data_evento.localeCompare(b.data_evento));
  const pendentes = contratos.filter((n) => ORDEM[n.status_contrato!] < 2).length;

  return (
    <div className="space-y-6">
      <TituloPagina
        titulo="Meus contratos"
        subtitulo="Leia, assine e pague os contratos gerados a partir das propostas aceitas."
      />

      {pendentes > 0 && (
        <Alerta tipo="aviso" titulo={pendentes === 1 ? "1 contrato precisa da sua atenção" : `${pendentes} contratos precisam da sua atenção`}>
          Assine e pague para garantir a data do seu evento.
        </Alerta>
      )}

      {erro ? (
        <Alerta tipo="erro" titulo="Não foi possível carregar seus contratos">
          {erro}
        </Alerta>
      ) : contratos.length === 0 ? (
        <Vazio
          Icone={FileSignature}
          titulo="Você ainda não tem contratos"
          texto="O contrato é gerado quando você aceita a proposta de um buffet. Veja suas propostas em Solicitações e propostas."
          acao={
            <BotaoLink href="/cliente/solicitacoes">
              Ver solicitações e propostas <ArrowRight className="size-4" />
            </BotaoLink>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_120px_170px_190px] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
            <span>Buffet</span>
            <span>Evento</span>
            <span>Valor</span>
            <span>Status</span>
            <span className="text-right">Ações</span>
          </div>
          {contratos.map((n) => (
            <article
              key={n.contrato_id}
              className="card grid gap-4 p-4 transition hover:shadow-lift sm:p-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_120px_170px_190px] lg:items-center"
            >
              <Link href={`/cliente/contratos/${n.contrato_id}`} className="group flex min-w-0 items-center gap-3">
                <Foto src={n.buffet_capa_url} alt={`Foto do ${n.buffet_nome}`} className="size-14 shrink-0 rounded-xl" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900 group-hover:text-brand-700">{n.buffet_nome}</p>
                  <p className="text-xs text-slate-400">Contrato {numeroContrato(n.contrato_id!)}</p>
                </div>
              </Link>
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium text-slate-700">{n.tipo_evento}</p>
                <p className="text-slate-500">
                  {dataBR(n.data_evento)} · {n.num_convidados} convidados
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 lg:contents">
                <p className="text-lg font-extrabold text-brand-700 lg:text-base">{moeda(n.valor_total)}</p>
                <div>
                  <SeloStatus status={n.status_contrato!} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 lg:justify-end lg:border-0 lg:pt-0">
                <BotaoLink href={`/cliente/contratos/${n.contrato_id}`} variante="fantasma" tamanho="sm">
                  Ver contrato
                </BotaoLink>
                <AcaoContrato n={n} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
