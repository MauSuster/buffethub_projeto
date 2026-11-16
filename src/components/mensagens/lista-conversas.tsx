"use client";

import Link, { useLinkStatus } from "next/link";
import { useState } from "react";
import { MessagesSquare, PenLine, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { BotaoLink } from "@/components/ui/botao";
import { AvatarContato } from "@/components/mensagens/avatar-contato";
import { TempoRelativo } from "@/components/mensagens/tempo-relativo";
import type { Contato } from "@/components/mensagens/tipos";
import type { Conversa, TipoUsuario } from "@/lib/database.types";

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function IndicadorAbrindo() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-3 left-0 w-1 rounded-full bg-brand-500 transition-opacity",
        pending ? "animate-pulse opacity-100" : "opacity-0",
      )}
    />
  );
}

function ItemConversa({ conversa, ativa, href }: { conversa: Conversa; ativa: boolean; href: string }) {
  const naoLidas = ativa ? 0 : conversa.nao_lidas;
  return (
    <Link
      href={href}
      aria-current={ativa ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-3 transition",
        ativa ? "bg-brand-50 ring-1 ring-inset ring-brand-100" : "hover:bg-slate-50",
      )}
    >
      <IndicadorAbrindo />
      <AvatarContato nome={conversa.outro_nome} tipo={conversa.outro_tipo} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn("truncate text-sm text-slate-900", naoLidas > 0 ? "font-bold" : "font-semibold")}>
            {conversa.outro_nome}
          </p>
          <TempoRelativo
            iso={conversa.ultima_data}
            className={cn("shrink-0 text-[11px]", naoLidas > 0 ? "font-semibold text-brand-600" : "text-slate-400")}
          />
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={cn("truncate text-[13px]", naoLidas > 0 ? "font-medium text-slate-800" : "text-slate-500")}>
            {conversa.ultima_mensagem}
          </p>
          {naoLidas > 0 && (
            <span
              className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white"
              aria-label={`${naoLidas} ${naoLidas === 1 ? "mensagem não lida" : "mensagens não lidas"}`}
            >
              {naoLidas > 99 ? "99+" : naoLidas}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ItemNovaConversa({ contato, href }: { contato: Contato; href: string }) {
  return (
    <Link
      href={href}
      aria-current="page"
      className="relative flex items-center gap-3 rounded-xl bg-brand-50 px-3 py-3 ring-1 ring-inset ring-brand-100"
    >
      <AvatarContato nome={contato.nome} tipo={contato.tipo} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{contato.nome}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[13px] font-medium text-brand-600">
          <PenLine className="size-3.5" /> Nova conversa
        </p>
      </div>
    </Link>
  );
}

function ListaVazia({ meuTipo }: { meuTipo: TipoUsuario }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <MessagesSquare className="size-6" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-800">Nenhuma conversa ainda</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {meuTipo === "cliente"
          ? "Abra o perfil de um buffet e clique em “Enviar mensagem” para tirar suas dúvidas."
          : "Quando um cliente escrever para o seu buffet, a conversa aparece aqui."}
      </p>
      {meuTipo === "cliente" && (
        <BotaoLink href="/" variante="secundario" tamanho="sm" className="mt-4">
          <Search className="size-3.5" /> Buscar buffets
        </BotaoLink>
      )}
    </div>
  );
}

type Props = {
  conversas: Conversa[];
  idAberto: string | null;
  novaConversa: Contato | null;
  base: string;
  meuTipo: TipoUsuario;
  className?: string;
};

export function ListaConversas({ conversas, idAberto, novaConversa, base, meuTipo, className }: Props) {
  const [busca, setBusca] = useState("");
  const termo = normalizar(busca);
  const filtradas = termo ? conversas.filter((c) => normalizar(c.outro_nome).includes(termo)) : conversas;
  const totalNaoLidas = conversas.reduce((t, c) => t + (c.outro_id === idAberto ? 0 : c.nao_lidas), 0);

  return (
    <aside className={cn("flex min-h-0 flex-col border-slate-100 md:border-r", className)}>
      <div className="space-y-3 border-b border-slate-100 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">Conversas</h2>
          {totalNaoLidas > 0 && (
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">
              {totalNaoLidas} {totalNaoLidas === 1 ? "nova" : "novas"}
            </span>
          )}
        </div>
        {conversas.length > 0 && (
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pelo nome"
              aria-label="Buscar conversa pelo nome"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </label>
        )}
      </div>

      <nav aria-label="Conversas" className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {novaConversa && !termo && <ItemNovaConversa contato={novaConversa} href={`${base}?com=${novaConversa.id}`} />}
        {filtradas.map((c) => (
          <ItemConversa key={c.outro_id} conversa={c} ativa={c.outro_id === idAberto} href={`${base}?com=${c.outro_id}`} />
        ))}
        {conversas.length === 0 && !novaConversa && <ListaVazia meuTipo={meuTipo} />}
        {conversas.length > 0 && filtradas.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-slate-500">Nenhuma conversa com “{busca.trim()}”.</p>
        )}
      </nav>
    </aside>
  );
}
