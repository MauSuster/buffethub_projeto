"use client";

// PROVISÓRIO: a área de mensagens/notificações substitui este componente pela versão com lista e tempo real.
import { Bell } from "lucide-react";

export function SinoNotificacoes({ usuarioId }: { usuarioId: string }) {
  return (
    <button className="grid size-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Notificações" data-usuario={usuarioId}>
      <Bell className="size-5" />
    </button>
  );
}
