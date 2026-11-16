"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  FileSignature,
  Home,
  Inbox,
  MessageSquare,
  PartyPopper,
  Store,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

const ICONES: Record<string, LucideIcon> = {
  inicio: Home,
  solicitacoes: ClipboardList,
  contratos: FileSignature,
  reservas: PartyPopper,
  mensagens: MessageSquare,
  perfil: UserRound,
  dados: Store,
  cardapio: UtensilsCrossed,
  calendario: CalendarDays,
  pedidos: Inbox,
};

export type ItemMenu = { href: string; rotulo: string; icone: keyof typeof ICONES; codigo?: string };

/** Layout dos painéis (T7.0 Cliente e T8.0 Anfitrião): menu lateral + conteúdo. */
export function LayoutPainel({ titulo, itens, children }: { titulo: string; itens: ItemMenu[]; children: React.ReactNode }) {
  const caminho = usePathname();
  const ativo = (href: string) => (href.split("/").length <= 2 ? caminho === href : caminho.startsWith(href));
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:py-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 hidden px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 lg:block">{titulo}</p>
        <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {itens.map((item) => {
            const Icone = ICONES[item.icone];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  ativo(item.href) ? "bg-brand-600 text-white shadow-sm shadow-brand-900/20" : "text-slate-600 hover:bg-white hover:text-slate-900",
                )}
              >
                <Icone className="size-4" />
                {item.rotulo}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
