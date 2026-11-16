"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, ImageOff, Images, Play, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TipoMidia } from "@/lib/database.types";

export type ItemGaleria = { id: string; url: string; tipo: TipoMidia; descricao: string | null };

function Midia({ item, nome, className, controles = false }: { item: ItemGaleria; nome: string; className?: string; controles?: boolean }) {
  const legenda = item.descricao ?? `Foto de ${nome}`;
  if (item.tipo === "video") {
    return <video src={item.url} className={className} controls={controles} muted={!controles} playsInline preload="metadata" aria-label={legenda} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={item.url} alt={legenda} className={className} />;
}

export function Galeria({ itens, nome }: { itens: ItemGaleria[]; nome: string }) {
  const [atual, setAtual] = useState(0);
  const [ampliada, setAmpliada] = useState(false);
  const total = itens.length;

  const mover = useCallback((passo: number) => setAtual((i) => (i + passo + total) % total), [total]);

  useEffect(() => {
    if (!ampliada) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAmpliada(false);
      if (e.key === "ArrowRight") mover(1);
      if (e.key === "ArrowLeft") mover(-1);
    };
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", tecla);
    };
  }, [ampliada, mover]);

  if (total === 0) {
    return (
      <div className="grid aspect-[16/9] place-items-center rounded-[var(--radius-card)] bg-gradient-to-br from-brand-200 via-brand-100 to-accent-100 text-brand-700">
        <div className="flex flex-col items-center gap-2 text-sm font-medium">
          <ImageOff className="size-8 opacity-70" />
          Este buffet ainda não publicou fotos.
        </div>
      </div>
    );
  }

  const item = itens[atual];
  const rotuloContador = `${atual + 1} / ${total} ${total === 1 ? "foto" : "fotos"}`;

  return (
    <div className="space-y-3">
      <div className="group relative overflow-hidden rounded-[var(--radius-card)] bg-slate-900 shadow-soft">
        <button
          type="button"
          onClick={() => setAmpliada(true)}
          className="block aspect-[16/9] w-full cursor-zoom-in"
          aria-label="Ampliar foto"
        >
          <Midia item={item} nome={nome} className="size-full object-cover transition duration-500 group-hover:scale-[1.02]" />
        </button>
        <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <Images className="size-3.5" /> {rotuloContador}
        </span>
        <span className="pointer-events-none absolute right-3 top-3 hidden items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm group-hover:inline-flex">
          <Expand className="size-3.5" /> Ampliar
        </span>
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => mover(-1)}
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 opacity-0 shadow-md transition group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => mover(1)}
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 opacity-0 shadow-md transition group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Próxima foto"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
          {itens.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setAtual(i)}
              className={cn(
                "relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-slate-50 transition sm:w-auto",
                i === atual ? "ring-brand-500" : "ring-transparent opacity-80 hover:opacity-100",
              )}
              aria-label={`Ver ${m.descricao ?? `foto ${i + 1}`}`}
              aria-current={i === atual}
            >
              <Midia item={m} nome={nome} className="size-full object-cover" />
              {m.tipo === "video" && (
                <span className="absolute inset-0 grid place-items-center bg-slate-900/30">
                  <span className="grid size-8 place-items-center rounded-full bg-white/90 text-slate-900">
                    <Play className="size-4 fill-current" />
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {ampliada && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fotos de ${nome}`}
          className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-sm"
          onClick={() => setAmpliada(false)}
        >
          <div className="flex items-center justify-between px-4 py-3 text-sm text-white/80 sm:px-6">
            <span className="font-semibold">{rotuloContador}</span>
            <button
              type="button"
              onClick={() => setAmpliada(false)}
              className="grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Fechar"
              autoFocus
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20" onClick={(e) => e.stopPropagation()}>
            <Midia item={item} nome={nome} controles className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => mover(-1)}
                  className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => mover(1)}
                  className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>
          <p className="px-4 py-4 text-center text-sm text-white/80" onClick={(e) => e.stopPropagation()}>
            {item.descricao ?? nome}
          </p>
        </div>
      )}
    </div>
  );
}
