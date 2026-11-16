"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DataIndisponivel } from "@/models/perfil-buffet";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES_A_FRENTE = 12;

function iso(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function nomeMes(ano: number, mes: number) {
  const texto = new Date(Date.UTC(ano, mes, 1)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** T5.0: datas livres do buffet. Data sem registro no banco é Livre. */
export function CalendarioDisponibilidade({
  indisponiveis,
  hoje,
  linkOrcamento,
}: {
  indisponiveis: DataIndisponivel[];
  hoje: string;
  linkOrcamento?: string | null;
}) {
  const [deslocamento, setDeslocamento] = useState(0);
  const ocupadas = useMemo(() => new Map(indisponiveis.map((d) => [d.data, d.status])), [indisponiveis]);

  const [anoHoje, mesHoje] = hoje.split("-").map(Number);
  const base = new Date(Date.UTC(anoHoje, mesHoje - 1 + deslocamento, 1));
  const ano = base.getUTCFullYear();
  const mes = base.getUTCMonth();
  const primeiroDiaSemana = base.getUTCDay();
  const diasNoMes = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();

  const celulas: (number | null)[] = [...Array(primeiroDiaSemana).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)];

  let livres = 0;
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const d = iso(ano, mes, dia);
    if (d > hoje && !ocupadas.has(d)) livres++;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setDeslocamento((v) => v - 1)}
          disabled={deslocamento === 0}
          className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-slate-900" aria-live="polite">
            {nomeMes(ano, mes)}
          </p>
          <p className="text-xs text-slate-500">
            {livres === 0 ? "Nenhuma data livre" : `${livres} ${livres === 1 ? "data livre" : "datas livres"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDeslocamento((v) => v + 1)}
          disabled={deslocamento >= MESES_A_FRENTE}
          className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
          aria-label="Próximo mês"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-sm">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i} className="pb-1 text-xs font-semibold text-slate-400">
            {d}
          </span>
        ))}
        {celulas.map((dia, i) => {
          if (dia == null) return <span key={`v${i}`} />;
          const d = iso(ano, mes, dia);
          const status = ocupadas.get(d);
          const passou = d <= hoje;
          const classeBase = "grid aspect-square place-items-center rounded-lg text-sm font-semibold transition";
          if (passou) {
            return (
              <span key={d} className={cn(classeBase, "font-medium text-slate-300")} title="Data já passou">
                {dia}
              </span>
            );
          }
          if (status === "Reservada") {
            return (
              <span key={d} className={cn(classeBase, "bg-brand-600 text-white")} title="Indisponível: data reservada">
                {dia}
              </span>
            );
          }
          if (status === "Bloqueada") {
            return (
              <span
                key={d}
                className={cn(classeBase, "bg-[repeating-linear-gradient(135deg,#fee2e2_0,#fee2e2_4px,#fff_4px,#fff_8px)] text-red-600 line-through")}
                title="Indisponível: data bloqueada pelo buffet"
              >
                {dia}
              </span>
            );
          }
          const classeLivre = cn(classeBase, "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100");
          return linkOrcamento ? (
            <Link
              key={d}
              href={`${linkOrcamento}?data=${d}`}
              className={cn(classeLivre, "hover:bg-emerald-500 hover:text-white hover:ring-emerald-500")}
              title="Livre: clique para pedir orçamento nesta data"
            >
              {dia}
            </Link>
          ) : (
            <span key={d} className={classeLivre} title="Livre">
              {dia}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-emerald-50 ring-1 ring-inset ring-emerald-300" /> Livre
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-brand-600" /> Reservada
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-[repeating-linear-gradient(135deg,#fca5a5_0,#fca5a5_2px,#fff_2px,#fff_4px)] ring-1 ring-inset ring-red-200" /> Bloqueada
        </span>
      </div>
      {linkOrcamento && <p className="mt-3 text-xs text-slate-500">Dica: clique em uma data livre para pedir orçamento já com ela preenchida.</p>}
    </div>
  );
}
