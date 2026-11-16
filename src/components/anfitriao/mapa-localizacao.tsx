"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

export type Ponto = { lat: number; lng: number };

const CENTRO_SAO_PAULO: [number, number] = [-23.5505, -46.6333];

const ICONE = L.divIcon({
  className: "",
  html: '<span class="relative block size-8 -rotate-45 rounded-full rounded-bl-none bg-brand-600 shadow-lg ring-4 ring-white"><span class="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></span></span>',
  iconSize: [32, 32],
  iconAnchor: [16, 38],
});

function CliqueNoMapa({ aoEscolher }: { aoEscolher: (ponto: Ponto) => void }) {
  useMapEvents({ click: (e) => aoEscolher({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function VoarPara({ foco }: { foco: Ponto | null }) {
  const mapa = useMap();
  useEffect(() => {
    if (foco) mapa.flyTo([foco.lat, foco.lng], 16);
  }, [foco, mapa]);
  return null;
}

export function MapaLocalizacao({ ponto, foco, aoEscolher }: {
  ponto: Ponto | null;
  foco: Ponto | null;
  aoEscolher: (ponto: Ponto) => void;
}) {
  return (
    <MapContainer
      center={ponto ? [ponto.lat, ponto.lng] : CENTRO_SAO_PAULO}
      zoom={ponto ? 15 : 11}
      scrollWheelZoom={false}
      className="h-72 w-full cursor-crosshair sm:h-80"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CliqueNoMapa aoEscolher={aoEscolher} />
      <VoarPara foco={foco} />
      {ponto && (
        <Marker
          position={[ponto.lat, ponto.lng]}
          icon={ICONE}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const posicao = (e.target as L.Marker).getLatLng();
              aoEscolher({ lat: posicao.lat, lng: posicao.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
