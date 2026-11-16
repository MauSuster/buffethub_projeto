import { CalendarDays, MapPin, PartyPopper, Users, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { data as dataBR, moeda } from "@/lib/formatos";
import type { Negociacao } from "@/lib/database.types";

export function ItemInfo({ Icone, rotulo, children, className }: {
  Icone: LucideIcon;
  rotulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-start gap-2.5", className)}>
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icone className="size-3.5" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{rotulo}</dt>
        <dd className="truncate text-sm font-medium text-slate-700">{children}</dd>
      </div>
    </div>
  );
}

/** Dados do evento de uma negociação (tipo, data, convidados, local e pacote). */
export function InfoEvento({ n, comPacote = true, umaColuna = false, className }: {
  n: Negociacao;
  comPacote?: boolean;
  umaColuna?: boolean;
  className?: string;
}) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3", !umaColuna && "sm:grid-cols-2", className)}>
      <ItemInfo Icone={PartyPopper} rotulo="Evento">
        {n.tipo_evento}
      </ItemInfo>
      <ItemInfo Icone={CalendarDays} rotulo="Data">
        {dataBR(n.data_evento)}
      </ItemInfo>
      <ItemInfo Icone={Users} rotulo="Convidados">
        {n.num_convidados}
      </ItemInfo>
      <ItemInfo Icone={MapPin} rotulo="Local">
        <span title={n.local}>{n.local}</span>
      </ItemInfo>
      {comPacote && (
        <ItemInfo Icone={UtensilsCrossed} rotulo="Pacote" className={umaColuna ? undefined : "sm:col-span-2"}>
          {n.pacote_nome ? (
            <>
              {n.pacote_nome}
              {n.pacote_preco_por_pessoa != null && (
                <span className="font-normal text-slate-500"> · {moeda(n.pacote_preco_por_pessoa)} por pessoa</span>
              )}
            </>
          ) : (
            <span className="font-normal text-slate-500">A definir com o buffet</span>
          )}
        </ItemInfo>
      )}
    </dl>
  );
}
