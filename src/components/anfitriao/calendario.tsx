"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Inbox, Loader2, Lock, PartyPopper, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import type { EstadoAcao } from "@/lib/acoes";
import type { StatusData } from "@/lib/database.types";
import { data as dataBR } from "@/lib/formatos";
import { alterarDisponibilidade } from "@/controllers/anfitriao";
import { Botao } from "@/components/ui/botao";
import { Cartao, MensagemAcao } from "@/components/ui/basicos";
import { deslocarMes, diaDaSemana, diasNoMes, nomeCurtoDoMes, nomeDoMes, primeiroDiaDaSemana } from "./datas";
import { primeiroNome } from "./negociacao";

export type ReservaDia = {
  data: string;
  solicitacaoId: string;
  tipoEvento: string;
  cliente: string;
  convidados: number;
  local: string;
};

type Props = {
  mes: string;
  hoje: string;
  datas: { data: string; status: StatusData }[];
  reservas: ReservaDia[];
  pedidos: { data: string; quantidade: number }[];
};

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const LEGENDA = [
  { rotulo: "Livre", classe: "border border-emerald-200 bg-emerald-50" },
  { rotulo: "Bloqueada", classe: "border border-slate-300 bg-slate-200" },
  { rotulo: "Reservada", classe: "bg-brand-600" },
  { rotulo: "Já passou", classe: "border border-slate-200 bg-slate-50" },
];

/** T8.3 / UC19: calendário do mês. Clique numa data futura alterna Livre ↔ Bloqueada. */
export function CalendarioDisponibilidade({ mes, hoje, datas, reservas, pedidos }: Props) {
  const router = useRouter();
  const [navegando, iniciarNavegacao] = useTransition();
  const [, iniciarAlteracao] = useTransition();
  const [alterando, setAlterando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<EstadoAcao>({});

  const statusServidor = useMemo(() => {
    const mapa: Record<string, StatusData> = {};
    for (const d of datas) mapa[d.data] = d.status;
    return mapa;
  }, [datas]);
  const [status, aplicarStatus] = useOptimistic(
    statusServidor,
    (atual, mudanca: { data: string; status: StatusData }) => ({ ...atual, [mudanca.data]: mudanca.status }),
  );
  const reservaPorData = useMemo(() => new Map(reservas.map((r) => [r.data, r])), [reservas]);
  const pedidosPorData = useMemo(() => new Map(pedidos.map((p) => [p.data, p.quantidade])), [pedidos]);

  const dias = Array.from({ length: diasNoMes(mes) }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`);
  const vazias = primeiroDiaDaSemana(mes);
  const mesAtual = hoje.slice(0, 7);
  const statusDe = (d: string) => status[d] ?? "Livre";
  const futuros = dias.filter((d) => d >= hoje);
  const resumo = {
    livres: futuros.filter((d) => statusDe(d) === "Livre").length,
    bloqueadas: futuros.filter((d) => statusDe(d) === "Bloqueada").length,
    reservadas: dias.filter((d) => statusDe(d) === "Reservada").length,
  };
  const totalPedidos = pedidos.reduce((t, p) => t + p.quantidade, 0);

  function irPara(alvo: string) {
    setAviso({});
    iniciarNavegacao(() => router.push(`/anfitriao/calendario?mes=${alvo}`, { scroll: false }));
  }

  function alternar(dia: string) {
    const atual = statusDe(dia);
    if (atual === "Reservada" || dia < hoje) return;
    const novo = atual === "Bloqueada" ? "Livre" : "Bloqueada";
    setAlterando(dia);
    iniciarAlteracao(async () => {
      aplicarStatus({ data: dia, status: novo });
      const r = await alterarDisponibilidade(dia, novo);
      setAviso(r.ok ? { ok: true, mensagem: `${dataBR(dia)}: ${r.mensagem}` } : r);
      setAlterando(null);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Cartao className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{nomeDoMes(mes)}</h2>
            <p className="text-sm text-slate-500">Clique em uma data futura para bloquear ou liberar.</p>
          </div>
          <div className="flex items-center gap-1">
            {navegando && <Loader2 className="mr-1 size-4 animate-spin text-slate-400" />}
            <Botao type="button" variante="secundario" tamanho="sm" onClick={() => irPara(deslocarMes(mes, -1))} aria-label="Mês anterior">
              <ChevronLeft className="size-4" />
            </Botao>
            {mes !== mesAtual && (
              <Botao type="button" variante="secundario" tamanho="sm" onClick={() => irPara(mesAtual)}>
                Hoje
              </Botao>
            )}
            <Botao type="button" variante="secundario" tamanho="sm" onClick={() => irPara(deslocarMes(mes, 1))} aria-label="Próximo mês">
              <ChevronRight className="size-4" />
            </Botao>
          </div>
        </div>

        <div aria-live="polite" className="mt-4 empty:mt-0">
          <MensagemAcao estado={aviso} />
        </div>

        <div className={cn("mt-5 transition-opacity", navegando && "pointer-events-none opacity-50")}>
          <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:gap-2 sm:text-xs">
            {SEMANA.map((d) => (
              <span key={d}>
                <span className="sm:hidden">{d[0]}</span>
                <span className="hidden sm:inline">{d}</span>
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: vazias }, (_, i) => (
              <span key={`vazio-${i}`} aria-hidden />
            ))}
            {dias.map((dia) => {
              const st = statusDe(dia);
              const passado = dia < hoje;
              const reserva = reservaPorData.get(dia);
              const qtdPedidos = pedidosPorData.get(dia) ?? 0;
              const numero = Number(dia.slice(8));
              const base =
                "relative flex aspect-square flex-col rounded-xl p-1.5 text-left text-sm transition sm:aspect-auto sm:h-24 sm:p-2";
              const destaqueHoje = dia === hoje && "ring-2 ring-accent-400 ring-offset-2";

              if (st === "Reservada") {
                const detalhe = reserva
                  ? `Reservada: ${reserva.tipoEvento} de ${reserva.cliente} (${reserva.convidados} convidados)`
                  : "Reservada por um contrato pago";
                return (
                  <div
                    key={dia}
                    title={detalhe}
                    aria-label={`${dataBR(dia)}. ${detalhe}`}
                    className={cn(base, "cursor-default bg-brand-600 text-white shadow-sm shadow-brand-900/20", passado && "opacity-50", destaqueHoje)}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-semibold">{numero}</span>
                      <PartyPopper className="hidden size-3.5 text-white/80 sm:block" />
                    </span>
                    <span className="mt-auto hidden min-w-0 sm:block">
                      <span className="block truncate text-xs font-semibold">{reserva?.tipoEvento ?? "Reservada"}</span>
                      {reserva && <span className="block truncate text-[11px] text-white/75">{primeiroNome(reserva.cliente)}</span>}
                    </span>
                    <span className="mx-auto mt-auto size-1.5 rounded-full bg-white sm:hidden" />
                  </div>
                );
              }

              const bloqueada = st === "Bloqueada";
              return (
                <button
                  key={dia}
                  type="button"
                  disabled={passado || alterando === dia}
                  onClick={() => alternar(dia)}
                  aria-pressed={bloqueada}
                  aria-label={
                    passado
                      ? `${dataBR(dia)}: data passada`
                      : `${dataBR(dia)}: ${st}. Clique para ${bloqueada ? "liberar" : "bloquear"}.`
                  }
                  title={passado ? "Data passada" : bloqueada ? "Bloqueada · clique para liberar" : "Livre · clique para bloquear"}
                  className={cn(
                    base,
                    passado
                      ? "cursor-not-allowed border border-slate-100 bg-slate-50 text-slate-300"
                      : bloqueada
                        ? "border border-slate-300 bg-slate-100 bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgb(226_232_240)_6px,rgb(226_232_240)_12px)] text-slate-500 hover:border-slate-400"
                        : "border border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-sm",
                    destaqueHoje,
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-semibold">{numero}</span>
                    {alterando === dia ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : bloqueada && !passado ? (
                      <Lock className="hidden size-3.5 sm:block" />
                    ) : null}
                  </span>
                  {!passado && (
                    <span className="mt-auto hidden text-xs font-medium sm:block">{bloqueada ? "Bloqueada" : "Livre"}</span>
                  )}
                  {qtdPedidos > 0 && !passado && (
                    <>
                      <span className="absolute right-1 top-1 size-2 rounded-full bg-accent-400 ring-2 ring-white sm:hidden" />
                      <span className="mt-1 hidden truncate rounded-md bg-accent-100 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700 sm:block">
                        {qtdPedidos === 1 ? "1 pedido" : `${qtdPedidos} pedidos`}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
          {LEGENDA.map((item) => (
            <span key={item.rotulo} className="inline-flex items-center gap-2">
              <span className={cn("size-3.5 rounded", item.classe)} /> {item.rotulo}
            </span>
          ))}
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-accent-400" /> Pedido de orçamento
          </span>
        </div>
      </Cartao>

      <div className="space-y-6">
        <Cartao className="p-5">
          <h3 className="text-sm font-semibold text-slate-900">Resumo do mês</h3>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-emerald-50 px-2 py-3">
              <dt className="text-[11px] font-medium text-emerald-700">Livres</dt>
              <dd className="text-xl font-bold text-emerald-800">{resumo.livres}</dd>
            </div>
            <div className="rounded-xl bg-slate-100 px-2 py-3">
              <dt className="text-[11px] font-medium text-slate-600">Bloqueadas</dt>
              <dd className="text-xl font-bold text-slate-700">{resumo.bloqueadas}</dd>
            </div>
            <div className="rounded-xl bg-brand-50 px-2 py-3">
              <dt className="text-[11px] font-medium text-brand-700">Reservadas</dt>
              <dd className="text-xl font-bold text-brand-800">{resumo.reservadas}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Uma data fica Reservada quando o cliente paga o contrato. Ela não pode ser bloqueada nem liberada.
          </p>
        </Cartao>

        <Cartao className="p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CalendarClock className="size-4 text-brand-600" /> Eventos reservados no mês
          </h3>
          {reservas.length === 0 ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">Nenhum evento reservado neste mês.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {reservas.map((r) => (
                <li key={r.solicitacaoId}>
                  <Link
                    href={`/anfitriao/solicitacoes?aba=respondidas&id=${r.solicitacaoId}`}
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                  >
                    <span className="grid w-12 shrink-0 place-items-center rounded-lg bg-brand-600 py-1 text-white">
                      <span className="text-base font-bold leading-tight">{r.data.slice(8, 10)}</span>
                      <span className="text-[10px] font-semibold uppercase">{nomeCurtoDoMes(r.data)}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {r.tipoEvento} · {r.cliente}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Users className="size-3" /> {r.convidados} convidados · {diaDaSemana(r.data)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        {totalPedidos > 0 && (
          <Link
            href="/anfitriao/solicitacoes?aba=pendentes"
            className="card flex items-center gap-3 p-4 transition hover:shadow-lift"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-50 text-accent-600">
              <Inbox className="size-5" />
            </span>
            <span className="text-sm">
              <span className="block font-semibold text-slate-800">
                {totalPedidos === 1 ? "1 pedido pendente" : `${totalPedidos} pedidos pendentes`} neste mês
              </span>
              <span className="text-slate-500">Responda antes de bloquear essas datas.</span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
