"use client";

import { useEffect, useReducer, useRef, useState, type Dispatch } from "react";
import { Bell, BellOff, CheckCheck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { criarClienteNavegador } from "@/lib/supabase/client";
import {
  carregarNotificacoes,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
  type ResumoNotificacoes,
} from "@/controllers/notificacoes";
import { ItemNotificacao } from "@/components/notificacoes/item-notificacao";
import type { Notificacao } from "@/lib/database.types";

const LIMITE = 10;

type Estado = {
  itens: Notificacao[];
  naoLidas: number;
  situacao: "carregando" | "pronto" | "erro";
  pulsando: boolean;
};

type Acao =
  | { tipo: "carregando" }
  | { tipo: "carregou"; resumo: ResumoNotificacoes }
  | { tipo: "falhou" }
  | { tipo: "chegou"; notificacao: Notificacao }
  | { tipo: "leu"; id: string }
  | { tipo: "leuTodas" }
  | { tipo: "parouPulso" };

const INICIAL: Estado = { itens: [], naoLidas: 0, situacao: "carregando", pulsando: false };

function reducer(estado: Estado, acao: Acao): Estado {
  switch (acao.tipo) {
    case "carregando":
      return { ...estado, situacao: "carregando" };
    case "carregou":
      return { ...estado, itens: acao.resumo.itens, naoLidas: acao.resumo.naoLidas, situacao: "pronto" };
    case "falhou":
      return { ...estado, situacao: estado.itens.length > 0 ? "pronto" : "erro" };
    case "chegou": {
      const nova = acao.notificacao;
      if (estado.itens.some((n) => n.id === nova.id)) return estado;
      return {
        ...estado,
        itens: [nova, ...estado.itens].slice(0, LIMITE),
        naoLidas: estado.naoLidas + (nova.lida ? 0 : 1),
        pulsando: !nova.lida,
      };
    }
    case "leu": {
      const alvo = estado.itens.find((n) => n.id === acao.id);
      if (!alvo || alvo.lida) return estado;
      return {
        ...estado,
        itens: estado.itens.map((n) => (n.id === acao.id ? { ...n, lida: true } : n)),
        naoLidas: Math.max(0, estado.naoLidas - 1),
      };
    }
    case "leuTodas":
      return { ...estado, itens: estado.itens.map((n) => (n.lida ? n : { ...n, lida: true })), naoLidas: 0 };
    case "parouPulso":
      return { ...estado, pulsando: false };
  }
}

async function sincronizar(despachar: Dispatch<Acao>) {
  const resumo = await carregarNotificacoes().catch(() => null);
  despachar(resumo ? { tipo: "carregou", resumo } : { tipo: "falhou" });
}

/** Sino do cabeçalho (RNF29): últimos avisos, contador de não lidos e chegada em tempo real. */
export function SinoNotificacoes({ usuarioId }: { usuarioId: string }) {
  const [estado, despachar] = useReducer(reducer, INICIAL);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void sincronizar(despachar);
  }, [usuarioId]);

  useEffect(() => {
    const supabase = criarClienteNavegador();
    let espera: ReturnType<typeof setTimeout> | undefined;
    let jaConectou = false;
    const recarregarEmBreve = () => {
      clearTimeout(espera);
      espera = setTimeout(() => void sincronizar(despachar), 400);
    };
    const filtro = `usuario_id=eq.${usuarioId}`;
    const canal = supabase
      .channel(`notificacoes-${usuarioId}-${Math.random().toString(36).slice(2)}`)
      .on<Notificacao>("postgres_changes", { event: "INSERT", schema: "public", table: "notificacao", filter: filtro }, (payload) =>
        despachar({ tipo: "chegou", notificacao: payload.new }),
      )
      .on<Notificacao>("postgres_changes", { event: "UPDATE", schema: "public", table: "notificacao", filter: filtro }, recarregarEmBreve)
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        if (jaConectou) recarregarEmBreve();
        jaConectou = true;
      });
    return () => {
      clearTimeout(espera);
      void supabase.removeChannel(canal);
    };
  }, [usuarioId]);

  useEffect(() => {
    if (!estado.pulsando) return;
    const id = setTimeout(() => despachar({ tipo: "parouPulso" }), 4000);
    return () => clearTimeout(id);
  }, [estado.pulsando]);

  useEffect(() => {
    if (!aberto) return;
    const fecharFora = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    const fecharEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("pointerdown", fecharFora);
    document.addEventListener("keydown", fecharEsc);
    return () => {
      document.removeEventListener("pointerdown", fecharFora);
      document.removeEventListener("keydown", fecharEsc);
    };
  }, [aberto]);

  function alternar() {
    if (!aberto && estado.situacao === "erro") {
      despachar({ tipo: "carregando" });
      void sincronizar(despachar);
    }
    setAberto((v) => !v);
  }

  function abrir(n: Notificacao) {
    setAberto(false);
    if (n.lida) return;
    despachar({ tipo: "leu", id: n.id });
    void marcarNotificacaoLida(n.id);
  }

  async function lerTodas() {
    despachar({ tipo: "leuTodas" });
    const ok = await marcarTodasNotificacoesLidas().catch(() => false);
    if (!ok) void sincronizar(despachar);
  }

  function tentarDeNovo() {
    despachar({ tipo: "carregando" });
    void sincronizar(despachar);
  }

  const { itens, naoLidas, situacao, pulsando } = estado;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={alternar}
        aria-label={naoLidas > 0 ? `Notificações: ${naoLidas} não ${naoLidas === 1 ? "lida" : "lidas"}` : "Notificações"}
        aria-expanded={aberto}
        aria-haspopup="menu"
        className={cn(
          "relative grid size-10 place-items-center rounded-full transition hover:bg-slate-100 hover:text-slate-800",
          aberto ? "bg-slate-100 text-slate-800" : "text-slate-500",
        )}
      >
        <Bell className={cn("size-5 transition-transform", pulsando && "-rotate-12")} />
        {naoLidas > 0 && (
          <span className="absolute right-1 top-1 grid">
            {pulsando && <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" aria-hidden />}
            <span className="relative grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          </span>
        )}
      </button>

      {aberto && (
        <div
          role="menu"
          aria-label="Notificações"
          className="fixed inset-x-4 top-[4.5rem] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">Notificações</p>
              {naoLidas > 0 && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
                  {naoLidas} {naoLidas === 1 ? "nova" : "novas"}
                </span>
              )}
            </div>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={() => void lerTodas()}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                <CheckCheck className="size-3.5" /> Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-[min(28rem,70dvh)] divide-y divide-slate-100 overflow-y-auto">
            {situacao === "carregando" && itens.length === 0 ? (
              <div className="space-y-1 p-2" aria-busy="true" aria-label="Carregando notificações">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3 px-2 py-2.5">
                    <div className="size-9 shrink-0 animate-pulse rounded-xl bg-slate-100" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
                      <div className="h-2.5 w-1/4 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : situacao === "erro" ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <p className="text-sm font-semibold text-slate-800">Não foi possível carregar os avisos.</p>
                <button
                  type="button"
                  onClick={tentarDeNovo}
                  className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                >
                  <RefreshCw className="size-3.5" /> Tentar de novo
                </button>
              </div>
            ) : itens.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <BellOff className="size-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">Nenhuma notificação por enquanto</p>
                <p className="mt-1 text-xs text-slate-500">Avisos sobre orçamentos, contratos, pagamentos e mensagens aparecem aqui.</p>
              </div>
            ) : (
              itens.map((n) => <ItemNotificacao key={n.id} notificacao={n} onAbrir={abrir} />)
            )}
          </div>

          {itens.length > 0 && naoLidas === 0 && (
            <p className="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-center text-xs text-slate-500">
              Tudo em dia! Você leu todos os avisos.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
