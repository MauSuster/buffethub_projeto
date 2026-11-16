import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarHeart,
  CircleCheckBig,
  CreditCard,
  FileSignature,
  Hourglass,
  Inbox,
  PartyPopper,
  PenLine,
  Search,
  Star,
  type LucideIcon,
} from "lucide-react";
import { exigirCliente } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { data as dataBR, hojeISO, moeda } from "@/lib/formatos";
import { listarNegociacoes } from "@/models/cliente";
import { Alerta, Cartao } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";
import { BlocoData } from "@/components/cliente/bloco-data";
import { diasEntre } from "@/components/cliente/utilidades";

export const metadata: Metadata = { title: "Minha área" };

type Resumo = { rotulo: string; valor: number; href: string; Icone: LucideIcon; cor: string; dica: string };
type Pendencia = { chave: string; Icone: LucideIcon; titulo: string; detalhe: string; href: string; acao: string };

function saudacao() {
  const hora = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }));
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

// T7.0 Painel do cliente
export default async function PainelCliente() {
  const sessao = await exigirCliente("/cliente");
  const { negociacoes, erro } = await listarNegociacoes(sessao.id);
  const hoje = hojeISO();

  const aguardando = negociacoes.filter((n) => n.status_solicitacao === "Pendente");
  const propostas = negociacoes.filter((n) => n.status_proposta === "Pendente");
  const paraAssinar = negociacoes.filter((n) => n.status_contrato === "Aguardando assinatura");
  const paraPagar = negociacoes.filter((n) => n.status_contrato === "Assinado");
  const proximos = negociacoes
    .filter((n) => n.status_contrato === "Pago" && n.data_evento >= hoje)
    .sort((a, b) => a.data_evento.localeCompare(b.data_evento));
  const paraAvaliar = negociacoes.filter((n) => n.status_contrato === "Concluído" && !n.avaliacao_id);

  const resumos: Resumo[] = [
    {
      rotulo: "Aguardando resposta",
      valor: aguardando.length,
      href: "/cliente/solicitacoes?aba=aguardando",
      Icone: Hourglass,
      cor: "bg-amber-50 text-amber-600",
      dica: "pedidos de orçamento",
    },
    {
      rotulo: "Propostas para decidir",
      valor: propostas.length,
      href: "/cliente/solicitacoes?aba=propostas",
      Icone: Inbox,
      cor: "bg-accent-100 text-accent-700",
      dica: "aceitar ou recusar",
    },
    {
      rotulo: "Contratos para assinar/pagar",
      valor: paraAssinar.length + paraPagar.length,
      href: "/cliente/contratos",
      Icone: FileSignature,
      cor: "bg-brand-50 text-brand-600",
      dica: "garanta sua data",
    },
    {
      rotulo: "Próximos eventos",
      valor: proximos.length,
      href: "/cliente/reservas",
      Icone: PartyPopper,
      cor: "bg-emerald-50 text-emerald-600",
      dica: "reservas confirmadas",
    },
  ];

  const pendencias: Pendencia[] = [
    ...propostas.map((n) => ({
      chave: `p-${n.solicitacao_id}`,
      Icone: Inbox,
      titulo: `Nova proposta de ${n.buffet_nome}: ${moeda(n.valor_total)}`,
      detalhe: `${n.tipo_evento} · válida até ${dataBR(n.proposta_validade)}`,
      href: "/cliente/solicitacoes?aba=propostas",
      acao: "Ver proposta",
    })),
    ...paraAssinar.map((n) => ({
      chave: `a-${n.contrato_id}`,
      Icone: PenLine,
      titulo: `Assine o contrato com ${n.buffet_nome}`,
      detalhe: `${n.tipo_evento} em ${dataBR(n.data_evento)}`,
      href: `/cliente/contratos/${n.contrato_id}`,
      acao: "Assinar",
    })),
    ...paraPagar.map((n) => ({
      chave: `g-${n.contrato_id}`,
      Icone: CreditCard,
      titulo: `Pague para reservar ${dataBR(n.data_evento)}`,
      detalhe: `${n.buffet_nome} · ${moeda(n.valor_total)}`,
      href: `/pagamento/${n.contrato_id}`,
      acao: "Pagar",
    })),
    ...paraAvaliar.map((n) => ({
      chave: `v-${n.contrato_id}`,
      Icone: Star,
      titulo: `Como foi com ${n.buffet_nome}?`,
      detalhe: `${n.tipo_evento} em ${dataBR(n.data_evento)}`,
      href: "/cliente/reservas",
      acao: "Avaliar",
    })),
  ];

  return (
    <div className="space-y-6">
      <section className="hero-gradient relative overflow-hidden rounded-[var(--radius-card)] px-6 py-8 text-white shadow-lift sm:px-8 sm:py-10">
        <div className="absolute -right-10 -bottom-16 size-56 rounded-full bg-white/5" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-brand-100">{saudacao()},</p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{sessao.nomeExibicao}!</h1>
            <p className="mt-2 max-w-lg text-sm text-brand-100 sm:text-base">
              Acompanhe seus orçamentos, contratos e reservas em um só lugar.
            </p>
          </div>
          <BotaoLink href="/" variante="destaque" tamanho="lg">
            <Search className="size-5" /> Buscar buffets
          </BotaoLink>
        </div>
      </section>

      {erro && (
        <Alerta tipo="erro" titulo="Não foi possível carregar seu resumo">
          {erro}
        </Alerta>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {resumos.map(({ rotulo, valor, href, Icone, cor, dica }) => (
          <Link
            key={rotulo}
            href={href}
            className="card group flex flex-col justify-between gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lift sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className={cn("grid size-10 place-items-center rounded-xl", cor)}>
                <Icone className="size-5" />
              </span>
              <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{valor}</p>
              <p className="text-sm font-semibold leading-tight text-slate-700">{rotulo}</p>
              <p className="mt-0.5 text-xs text-slate-400">{dica}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Cartao className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">O que fazer agora</h2>
          {pendencias.length === 0 ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              <CircleCheckBig className="size-5 shrink-0" />
              <p>
                Tudo em dia! Nenhuma pendência no momento.
                {negociacoes.length === 0 && " Que tal procurar um buffet para o seu próximo evento?"}
              </p>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {pendencias.slice(0, 6).map(({ chave, Icone, titulo, detalhe, href, acao }) => (
                <li key={chave} className="flex items-center gap-3 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icone className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{titulo}</p>
                    <p className="truncate text-xs text-slate-500">{detalhe}</p>
                  </div>
                  <BotaoLink href={href} variante="secundario" tamanho="sm" className="shrink-0">
                    {acao}
                  </BotaoLink>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900">Próximos eventos</h2>
            {proximos.length > 0 && (
              <Link href="/cliente/reservas" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                Ver todos
              </Link>
            )}
          </div>
          {proximos.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center">
              <CalendarHeart className="size-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">Nenhum evento reservado ainda.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {proximos.slice(0, 3).map((n) => {
                const dias = diasEntre(hoje, n.data_evento);
                return (
                  <li key={n.solicitacao_id}>
                    <Link
                      href="/cliente/reservas"
                      className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50"
                    >
                      <BlocoData iso={n.data_evento} compacto />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{n.tipo_evento}</p>
                        <p className="truncate text-xs text-slate-500">{n.buffet_nome}</p>
                        <p className="mt-0.5 text-xs font-semibold text-brand-700">
                          {dias === 0 ? "É hoje!" : dias === 1 ? "É amanhã" : `Faltam ${dias} dias`}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Cartao>
      </div>
    </div>
  );
}
