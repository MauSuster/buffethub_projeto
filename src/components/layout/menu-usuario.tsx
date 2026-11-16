"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, MessageSquare, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/basicos";
import { sair } from "@/controllers/sessao";
import type { TipoUsuario } from "@/lib/database.types";

export function MenuUsuario({ nome, email, tipo }: { nome: string; email: string; tipo: TipoUsuario }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const base = tipo === "buffet" ? "/anfitriao" : "/cliente";

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  const itens = [
    { href: base, rotulo: tipo === "buffet" ? "Painel do anfitrião" : "Minha área", Icone: LayoutDashboard },
    { href: `${base}/mensagens`, rotulo: "Mensagens", Icone: MessageSquare },
    { href: tipo === "buffet" ? "/anfitriao/dados" : "/cliente/perfil", rotulo: tipo === "buffet" ? "Dados do buffet" : "Meu perfil", Icone: UserRound },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300"
        aria-expanded={aberto}
        aria-haspopup="menu"
      >
        <Avatar nome={nome} className="size-8" />
        <span className="hidden max-w-36 truncate sm:block">{nome}</span>
        <ChevronDown className="size-4 text-slate-400" />
      </button>
      {aberto && (
        <div role="menu" className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{nome}</p>
            <p className="truncate text-xs text-slate-500">{email}</p>
          </div>
          <div className="p-1.5">
            {itens.map(({ href, rotulo, Icone }) => (
              <Link key={href} href={href} onClick={() => setAberto(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">
                <Icone className="size-4 text-slate-400" /> {rotulo}
              </Link>
            ))}
            <form action={sair}>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem">
                <LogOut className="size-4" /> Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
