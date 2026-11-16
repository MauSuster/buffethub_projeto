"use client";

import dynamic from "next/dynamic";
import { Map as IconeMapa, MapPinOff } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PropsMapa } from "@/components/busca/mapa-leaflet";

function CarregandoMapa() {
  return (
    <div className="grid size-full animate-pulse place-items-center bg-slate-100 text-slate-400">
      <span className="flex flex-col items-center gap-2 text-sm font-medium">
        <IconeMapa className="size-8" />
        Carregando mapa…
      </span>
    </div>
  );
}

const MapaLeaflet = dynamic(() => import("@/components/busca/mapa-leaflet"), {
  ssr: false,
  loading: CarregandoMapa,
});

/** Mapa dos resultados (OpenStreetMap). Só roda no navegador: o Leaflet precisa do window. */
export function MapaBuffets({ className, ...props }: PropsMapa & { className?: string }) {
  const comLocal = props.buffets.filter((b) => b.latitude != null && b.longitude != null).length;
  const semLocal = props.buffets.length - comLocal;

  return (
    <div
      className={cn(
        "relative isolate z-0 overflow-hidden rounded-[var(--radius-card)] border border-slate-200/70 bg-slate-100 shadow-soft",
        className,
      )}
    >
      {comLocal === 0 ? (
        <div className="grid size-full place-items-center p-6 text-center text-sm text-slate-500">
          <span className="flex flex-col items-center gap-2">
            <MapPinOff className="size-8 text-slate-400" />
            Nenhum destes buffets informou a localização no mapa.
          </span>
        </div>
      ) : (
        <>
          <MapaLeaflet {...props} />
          <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex flex-col gap-1.5">
            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-soft ring-1 ring-slate-200">
              Mapa · {comLocal} {comLocal === 1 ? "resultado" : "resultados"}
            </span>
            {semLocal > 0 && (
              <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] text-slate-500 shadow-soft ring-1 ring-slate-200">
                {semLocal} sem localização
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
