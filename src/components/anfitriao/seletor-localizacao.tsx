"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LocateFixed, MapPin, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Botao } from "@/components/ui/botao";
import type { Ponto } from "./mapa-localizacao";

const Mapa = dynamic(() => import("./mapa-localizacao").then((m) => m.MapaLocalizacao), {
  ssr: false,
  loading: () => (
    <div className="grid h-72 place-items-center bg-slate-100 text-sm text-slate-400 sm:h-80">
      <span className="inline-flex animate-pulse items-center gap-2">
        <MapPin className="size-4" /> Carregando mapa...
      </span>
    </div>
  ),
});

/** Mapa clicável que guarda latitude/longitude em campos ocultos do formulário. */
export function SeletorLocalizacao({ latitude, longitude, erro }: {
  latitude: number | null;
  longitude: number | null;
  erro?: string;
}) {
  const [ponto, setPonto] = useState<Ponto | null>(
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null,
  );
  const [foco, setFoco] = useState<Ponto | null>(null);
  const [aviso, setAviso] = useState("");
  const [localizando, setLocalizando] = useState(false);

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
      setAviso("Seu navegador não informa a localização. Clique no mapa para marcar.");
      return;
    }
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const p = { lat: posicao.coords.latitude, lng: posicao.coords.longitude };
        setPonto(p);
        setFoco(p);
        setAviso("");
        setLocalizando(false);
      },
      () => {
        setAviso("Não foi possível obter sua localização. Clique no mapa para marcar.");
        setLocalizando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">Localização no mapa</p>
        <div className="flex flex-wrap gap-1">
          <Botao type="button" variante="fantasma" tamanho="sm" onClick={usarMinhaLocalizacao} disabled={localizando}>
            <LocateFixed className={cn("size-3.5", localizando && "animate-spin")} /> Usar minha localização
          </Botao>
          {ponto && (
            <Botao type="button" variante="fantasma" tamanho="sm" onClick={() => setPonto(null)}>
              <X className="size-3.5" /> Remover marcador
            </Botao>
          )}
        </div>
      </div>
      <div className={cn("relative isolate z-0 overflow-hidden rounded-2xl border", erro ? "border-red-400" : "border-slate-200")}>
        <Mapa ponto={ponto} foco={foco} aoEscolher={setPonto} />
      </div>
      {erro ? (
        <p className="text-xs font-medium text-red-600">{erro}</p>
      ) : (
        <p className="text-xs text-slate-500">
          {ponto
            ? `Marcado em ${ponto.lat.toFixed(5)}, ${ponto.lng.toFixed(5)}. Arraste o marcador ou clique em outro ponto para ajustar.`
            : "Clique no mapa para marcar onde fica o buffet. Assim ele aparece no mapa da busca."}
        </p>
      )}
      {aviso && <p className="text-xs font-medium text-amber-700">{aviso}</p>}
      <input type="hidden" name="latitude" value={ponto ? String(ponto.lat) : ""} />
      <input type="hidden" name="longitude" value={ponto ? String(ponto.lng) : ""} />
    </div>
  );
}
