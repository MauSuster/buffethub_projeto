"use client";

import Link from "next/link";
import {
  Bell,
  CircleX,
  ClipboardList,
  CreditCard,
  FileSignature,
  MessageSquare,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { TempoRelativo } from "@/components/mensagens/tempo-relativo";
import type { Notificacao } from "@/lib/database.types";

function estiloDe(n: Notificacao): { Icone: LucideIcon; cor: string } {
  const texto = n.texto.toLowerCase();
  const link = n.link ?? "";
  if (link.includes("/mensagens")) return { Icone: MessageSquare, cor: "bg-brand-50 text-brand-600" };
  if (texto.includes("avalia")) return { Icone: Star, cor: "bg-accent-50 text-accent-600" };
  if (texto.includes("pagamento")) return { Icone: CreditCard, cor: "bg-emerald-50 text-emerald-600" };
  if (texto.includes("cancelou") || texto.includes("recusou")) return { Icone: CircleX, cor: "bg-red-50 text-red-500" };
  if (texto.includes("contrato")) return { Icone: FileSignature, cor: "bg-violet-50 text-violet-600" };
  if (texto.includes("proposta") || texto.includes("orçamento")) return { Icone: ClipboardList, cor: "bg-amber-50 text-amber-600" };
  return { Icone: Bell, cor: "bg-slate-100 text-slate-500" };
}

export function ItemNotificacao({ notificacao, onAbrir }: { notificacao: Notificacao; onAbrir: (n: Notificacao) => void }) {
  const { Icone, cor } = estiloDe(notificacao);
  const naoLida = !notificacao.lida;
  const classe = cn(
    "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none",
    naoLida && "bg-brand-50/40",
  );
  const conteudo = (
    <>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", cor)}>
        <Icone className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm leading-snug", naoLida ? "font-semibold text-slate-900" : "text-slate-600")}>
          {notificacao.texto}
        </span>
        <TempoRelativo iso={notificacao.criada_em} className="mt-0.5 block text-xs text-slate-400" />
      </span>
      <span
        className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", naoLida ? "bg-brand-500 ring-4 ring-brand-100" : "bg-transparent")}
        aria-hidden
      />
      {naoLida && <span className="sr-only">(não lida)</span>}
    </>
  );

  const link = notificacao.link;
  if (link && link.startsWith("/")) {
    return (
      <Link href={link} onClick={() => onAbrir(notificacao)} className={classe} role="menuitem">
        {conteudo}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => onAbrir(notificacao)} className={classe} role="menuitem">
      {conteudo}
    </button>
  );
}
