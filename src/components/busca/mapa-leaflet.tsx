"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { divIcon, latLngBounds, type DivIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { ArrowRight, Star } from "lucide-react";
import { Foto } from "@/components/ui/basicos";
import { formatarNota, localizacao } from "@/components/busca/info-buffet";
import { moeda } from "@/lib/formatos";
import type { BuffetBusca } from "@/lib/database.types";

export type PropsMapa = {
  buffets: BuffetBusca[];
  destaqueId?: string | null;
  onDestacar?: (id: string | null) => void;
  zoomComRoda?: boolean;
};

const CENTRO_PADRAO: [number, number] = [-23.5505, -46.6333];

const pinos = new Map<string, DivIcon>();

function pino(numero: number, destacado: boolean) {
  const chave = `${numero}-${destacado}`;
  const pronto = pinos.get(chave);
  if (pronto) return pronto;
  const fundo = destacado ? "#e8a33d" : "#2f5d8a";
  const texto = destacado ? "#0e1c2c" : "#ffffff";
  const escala = destacado ? 1.18 : 1;
  const icone = divIcon({
    className: "pino-buffet",
    iconSize: [36, 46],
    iconAnchor: [18, 45],
    popupAnchor: [0, -40],
    html: `<svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;transform:scale(${escala});transform-origin:50% 100%;transition:transform .15s ease;filter:drop-shadow(0 4px 6px rgb(15 23 42 / .35))"><path d="M18 1.5C8.9 1.5 1.5 8.9 1.5 18c0 12.1 14.3 24.7 15.5 25.8a1.5 1.5 0 0 0 2 0C20.2 42.7 34.5 30.1 34.5 18 34.5 8.9 27.1 1.5 18 1.5z" fill="${fundo}" stroke="#ffffff" stroke-width="2.5"/><text x="18" y="22.5" text-anchor="middle" font-size="13" font-weight="800" font-family="system-ui, sans-serif" fill="${texto}">${numero}</text></svg>`,
  });
  pinos.set(chave, icone);
  return icone;
}

function AjustarVisao({ chave }: { chave: string }) {
  const mapa = useMap();
  useEffect(() => {
    const pontos = chave
      .split(";")
      .filter(Boolean)
      .map((p) => p.split(",").map(Number) as [number, number]);
    if (pontos.length === 1) mapa.setView(pontos[0], 14);
    else if (pontos.length > 1) mapa.fitBounds(latLngBounds(pontos), { padding: [48, 48], maxZoom: 14 });
  }, [mapa, chave]);
  return null;
}

export default function MapaLeaflet({ buffets, destaqueId, onDestacar, zoomComRoda = false }: PropsMapa) {
  const pontos = useMemo(
    () =>
      buffets
        .map((b, i) => ({ buffet: b, numero: i + 1 }))
        .filter(({ buffet }) => buffet.latitude != null && buffet.longitude != null),
    [buffets],
  );
  const chave = pontos.map(({ buffet }) => `${buffet.latitude},${buffet.longitude}`).join(";");

  return (
    <MapContainer
      center={CENTRO_PADRAO}
      zoom={11}
      zoomControl={false}
      scrollWheelZoom={zoomComRoda}
      className="size-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ZoomControl position="topright" />
      <AjustarVisao chave={chave} />
      {pontos.map(({ buffet: b, numero }) => {
        const destacado = destaqueId === b.id;
        return (
          <Marker
            key={b.id}
            position={[b.latitude!, b.longitude!]}
            icon={pino(numero, destacado)}
            zIndexOffset={destacado ? 1000 : 0}
            title={b.nome_fantasia}
            eventHandlers={{
              mouseover: () => onDestacar?.(b.id),
              mouseout: () => onDestacar?.(null),
            }}
          >
            <Popup>
              <div className="w-56 font-sans">
                <Foto src={b.capa_url} alt={`Foto do ${b.nome_fantasia}`} className="h-24 w-full rounded-lg" />
                <div className="mt-2.5 text-[15px] font-bold leading-snug text-slate-900">{b.nome_fantasia}</div>
                <div className="mt-0.5 text-xs text-slate-500">{localizacao(b.endereco, b.cidade)}</div>
                <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-600">
                    {b.preco_min != null ? (
                      <>
                        <b className="text-brand-700">{moeda(b.preco_min)}</b>/pessoa
                      </>
                    ) : (
                      "Preço sob consulta"
                    )}
                  </span>
                  {b.nota_media != null && b.total_avaliacoes > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                      <Star className="size-3.5 fill-accent-400 text-accent-400" />
                      {formatarNota(b.nota_media)}
                    </span>
                  )}
                </div>
                <Link
                  href={`/buffet/${b.id}`}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white! transition hover:bg-brand-700"
                >
                  Ver buffet <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
